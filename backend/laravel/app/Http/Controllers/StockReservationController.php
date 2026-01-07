<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StockReservation;
use App\Models\Sale;
use App\Models\Batchitem;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockReservationController extends Controller
{
    // List reservations (inventory_user will use this)
    public function index(Request $request)
    {
        $query = StockReservation::with(['product','batch','sale']);
        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }
        return $query->get();
    }

    // Update a reservation (inventory_user confirms / rejects)
    public function update(Request $request, $id)
    {
        $reservation = StockReservation::find($id);
        if (!$reservation) return response()->json(['message' => 'Reservation not found'], 404);

        $data = $request->validate([
            'status' => 'required|string', // pending, reserved, rejected, cancelled
        ]);

        // When reserving, deduct stock from batches using FIFO (oldest purchase_date first)
        if ($data['status'] === 'reserved') {
            try {
                DB::transaction(function () use ($reservation, $data) {
                    $qtyToDeduct = (int) $reservation->quantity;

                    // Build query for batch items: if specific batch_id provided, target that batch only
                    if ($reservation->batch_id) {
                        $items = Batchitem::where('batch_id', $reservation->batch_id)
                            ->where('product_id', $reservation->product_id)
                            ->where('quantity', '>', 0)
                            ->orderBy('batch_item_id', 'asc')
                            ->get();
                    } else {
                        // join with batches to order by purchase_date (FIFO)
                        $items = Batchitem::where('product_id', $reservation->product_id)
                            ->where('quantity', '>', 0)
                            ->join('batches', 'batch_items.batch_id', '=', 'batches.batch_id')
                            ->orderBy('batches.purchase_date', 'asc')
                            ->select('batch_items.*')
                            ->get();
                    }

                    foreach ($items as $it) {
                        if ($qtyToDeduct <= 0) break;
                        $available = (int) $it->quantity;
                        if ($available <= 0) continue;
                        $take = min($available, $qtyToDeduct);
                        // decrement batch item quantity
                        $it->quantity = $available - $take;
                        $it->save();

                        // record stock movement
                        StockMovement::create([
                            'batch_id' => $it->batch_id,
                            'movement_type' => 'out',
                            'quantity' => $take,
                            'reference' => 'sale:' . $reservation->sale_id,
                            'movement_date' => now(),
                            'note' => 'Reserved for sale ' . $reservation->sale_id,
                        ]);

                        $qtyToDeduct -= $take;
                    }

                    if ($qtyToDeduct > 0) {
                        // not enough stock; rollback
                        throw new \Exception('Insufficient stock to reserve requested quantity');
                    }

                    // mark reservation as reserved
                    $reservation->status = 'reserved';
                    $reservation->save();

                    // If reservation confirmed, and all reservations for sale are reserved, update sale.order_status
                    $sale = $reservation->sale;
                    $all = $sale->reservations()->pluck('status')->unique();
                    if ($all->count() === 1 && $all->first() === 'reserved') {
                        $sale->order_status = 'reserved';
                        $sale->save();
                    }
                });
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], 400);
            }

            return $reservation->fresh();
        }

        // non-reserve status updates (rejected/cancelled/pending)
        $reservation->status = $data['status'];
        $reservation->save();

        // If reservation confirmed, and all reservations for sale are reserved, update sale.order_status
        if ($data['status'] === 'reserved') {
            $sale = $reservation->sale;
            $all = $sale->reservations()->pluck('status')->unique();
            if ($all->count() === 1 && $all->first() === 'reserved') {
                $sale->order_status = 'reserved';
                $sale->save();
            }
        }

        return $reservation->fresh();
    }
}
