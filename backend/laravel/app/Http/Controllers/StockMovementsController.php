<?php

namespace App\Http\Controllers;

use App\Models\ProductBatches;
use App\Models\StockMovement;
use App\Models\Batchitem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockMovementsController extends Controller
{
    /**
     * List stock adjustments (movement_type = 'adjust').
     */
    public function adjustmentsIndex(): JsonResponse
    {
        $request = request();

        $query = StockMovement::with([
            'batch.supplier',
            'batch.items.product',
        ])->orderByDesc('movement_date');

        // optional filters
        if ($request->has('type') && $request->query('type')) {
            $type = strtolower($request->query('type'));
            $query->whereRaw('LOWER(movement_type) = ?', [$type]);
        }

        if ($request->has('from') && $request->query('from')) {
            $query->where('movement_date', '>=', $request->query('from'));
        }

        if ($request->has('to') && $request->query('to')) {
            $query->where('movement_date', '<=', $request->query('to'));
        }

        if ($request->has('q') && $q = trim($request->query('q'))) {
            $q = strtolower($q);
            $query->where(function ($sub) use ($q) {
                $sub->whereRaw('LOWER(reference) LIKE ?', ["%{$q}%"])
                    ->orWhereRaw('LOWER(note) LIKE ?', ["%{$q}%"])
                    ->orWhereHas('batch', function ($b) use ($q) {
                        $b->whereRaw('LOWER(invoice_no) LIKE ?', ["%{$q}%"])
                          ->orWhereHas('supplier', function ($s) use ($q) {
                              $s->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"]);
                          });
                    });
            });
        }

        $adjustments = $query->get();

        return response()->json($adjustments);
    }

    /**
     * Store a new stock adjustment.
     *
     * Expected payload:
     * {
     *   "batch_id": 1,
     *   "quantity": -5,       // positive or negative
     *   "reference": "Manual adjustment",
     *   "note": "Damaged items removed"
     * }
     */
    public function storeAdjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'batch_id'  => ['required', 'exists:batches,batch_id'],
            'product_id' => ['required', 'exists:products,id'],
            'quantity'  => ['required', 'integer', 'not_in:0'],
            'reference' => ['nullable', 'string'],
            'note'      => ['nullable', 'string'],
        ]);
        // Apply adjustment to the specific batch item (by batch_id + product_id)
        try {
            $movement = null;
            DB::transaction(function () use ($validated, &$movement) {
                $batchItem = Batchitem::where('batch_id', $validated['batch_id'])
                    ->where('product_id', $validated['product_id'])
                    ->first();

                if (!$batchItem) {
                    throw new \Exception('Batch item not found for provided batch_id and product_id');
                }

                $newQty = (int) $batchItem->quantity + (int) $validated['quantity'];
                if ($newQty < 0) {
                    throw new \Exception('Adjustment would make batch item quantity negative');
                }

                $batchItem->quantity = $newQty;
                $batchItem->save();

                // record stock movement for audit
                $movement = StockMovement::create([
                    'batch_id' => $validated['batch_id'],
                    'movement_type' => 'adjust',
                    'quantity' => $validated['quantity'],
                    'reference' => $validated['reference'] ?? null,
                    'note' => $validated['note'] ?? null,
                    'movement_date' => now(),
                ]);
            });

            return response()->json([
                'message' => 'Stock adjustment applied and recorded',
                'data' => $movement ? $movement->load('batch.supplier') : null,
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}


