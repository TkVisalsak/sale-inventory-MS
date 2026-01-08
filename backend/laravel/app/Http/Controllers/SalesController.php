<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockReservation;

class SalesController extends Controller
{
    public function index()
    {
        return Sale::with(['items.product','customer','user','reservations'])->get();
    }

    public function show($id)
    {
        $sale = Sale::with(['items.product','customer','user','reservations'])->find($id);
        if (!$sale) return response()->json(['message' => 'Sale not found'], 404);
        return $sale;
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_number' => 'required|string|max:30|unique:sales,invoice_number',
            'customer_id' => 'nullable|exists:customers,id',
            'user_id' => 'required|exists:users,id',
            'sale_date' => 'nullable|date',
            'subtotal' => 'required|numeric',
            'discount' => 'nullable|numeric',
            'tax' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'order_status' => 'nullable|string',
            'payment_status' => 'nullable|string',
            'sale_type' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.batch_id' => 'nullable',
        ]);

        return DB::transaction(function () use ($data, $request) {
            $status = $request->input('order_status', 'draft');

            $sale = Sale::create([
                'invoice_number' => $data['invoice_number'],
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $data['user_id'],
                'sale_date' => $data['sale_date'] ?? now(),
                'subtotal' => $data['subtotal'],
                'discount' => $data['discount'] ?? 0,
                'tax' => $data['tax'] ?? 0,
                'grand_total' => $data['grand_total'],
                'order_status' => $status === 'submitted' ? 'pending_inventory' : ($status ?? 'draft'),
                'payment_status' => $data['payment_status'] ?? 'unpaid',
                'sale_type' => $data['sale_type'] ?? 'walk-in',
            ]);

            foreach ($data['items'] as $it) {
                $item = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $it['product_id'],
                    'batch_id' => $it['batch_id'] ?? null,
                    'quantity' => $it['quantity'],
                    'unit_price' => $it['unit_price'],
                    'discount' => $it['discount'] ?? 0,
                    'subtotal' => ($it['quantity'] * $it['unit_price']) - ($it['discount'] ?? 0),
                ]);

                // if sale is submitted, create a pending stock reservation for inventory_user to confirm
                if (($request->input('order_status') ?? 'draft') === 'submitted') {
                    StockReservation::create([
                        'sale_id' => $sale->id,
                        'product_id' => $it['product_id'],
                        'batch_id' => $it['batch_id'] ?? null,
                        'quantity' => $it['quantity'],
                        'status' => 'pending',
                        'expires_at' => null,
                    ]);
                }
            }

            return response()->json($sale->load(['items','reservations']), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $sale = Sale::with(['items','reservations'])->find($id);
        if (!$sale) return response()->json(['message' => 'Sale not found'], 404);


        $data = $request->only(['order_status','payment_status']);
        $oldStatus = $sale->order_status;

        // Prevent marking as delivered unless there are actual reserved stock reservations
        if (isset($data['order_status']) && $data['order_status'] === 'delivered') {
            $hasReserved = $sale->reservations()->whereIn('status', ['reserved', 'confirmed', 'allocated'])->exists();
            if (!$hasReserved) {
                return response()->json(['message' => 'Cannot mark delivered: no reserved stock'], 400);
            }
            $sale->order_status = 'delivered';
        } else {
            if (isset($data['order_status'])) {
                $sale->order_status = $data['order_status'];
            }
        }
        if (isset($data['payment_status'])) {
            $sale->payment_status = $data['payment_status'];
        }
        $sale->save();

        // If the order was submitted via the update endpoint, create pending stock reservations
        // for any items that don't already have one. This matches the behavior when creating
        // a sale with order_status=submitted or calling generateInvoice.
        if (isset($data['order_status']) && $data['order_status'] === 'submitted') {
            foreach ($sale->items as $it) {
                $exists = StockReservation::where('sale_id', $sale->id)
                    ->where('product_id', $it->product_id)
                    ->where('batch_id', $it->batch_id)
                    ->exists();

                if (!$exists) {
                    StockReservation::create([
                        'sale_id' => $sale->id,
                        'product_id' => $it->product_id,
                        'batch_id' => $it->batch_id,
                        'quantity' => $it->quantity,
                        'status' => 'pending',
                        'expires_at' => null,
                    ]);
                }
            }

            // move to pending_inventory to indicate inventory must confirm
            $sale->order_status = 'pending_inventory';
            $sale->save();
        }

        return $sale->fresh();
    }

    // List sales that are unpaid or have outstanding balance
    public function unpaidList()
    {
        $sales = Sale::with(['items.product','customer','user','payments'])->get()->map(function($sale){
            $paid = $sale->payments->sum('amount');
            $outstanding = max(0, $sale->grand_total - $paid);
            $s = $sale->toArray();
            $s['paid_amount'] = (float)$paid;
            $s['outstanding'] = (float)$outstanding;
            return $s;
        })->filter(function($s){
            return $s['outstanding'] > 0;
        })->values();

        return $sales;
    }

    // List sales that are fully paid
    public function paidList()
    {
        $sales = Sale::with(['items.product','customer','user','payments'])->get()->map(function($sale){
            $paid = $sale->payments->sum('amount');
            $outstanding = max(0, $sale->grand_total - $paid);
            $s = $sale->toArray();
            $s['paid_amount'] = (float)$paid;
            $s['outstanding'] = (float)$outstanding;
            return $s;
        })->filter(function($s){
            return $s['outstanding'] <= 0;
        })->values();

        return $sales;
    }

    // Generate invoice for a sale: if sale is draft, transition to pending_inventory
    // and create pending stock reservations for items that don't have them yet.
    public function generateInvoice(Request $request, $id)
    {
        $sale = Sale::with(['items'])->find($id);
        if (!$sale) return response()->json(['message' => 'Sale not found'], 404);

        // If sale is draft, treat invoice generation as submit: create reservations
        if ($sale->order_status === 'draft') {
            $sale->order_status = 'pending_inventory';
            $sale->save();

            foreach ($sale->items as $it) {
                // only create reservation if one doesn't already exist for this sale+item
                $exists = StockReservation::where('sale_id', $sale->id)
                    ->where('product_id', $it->product_id)
                    ->where('batch_id', $it->batch_id)
                    ->exists();

                if (!$exists) {
                    StockReservation::create([
                        'sale_id' => $sale->id,
                        'product_id' => $it->product_id,
                        'batch_id' => $it->batch_id,
                        'quantity' => $it->quantity,
                        'status' => 'pending',
                        'expires_at' => null,
                    ]);
                }
            }
        }

        // Build simple invoice payload and return
        $sale->load(['items.product','customer','user','reservations']);
        $invoice = [
            'invoice_number' => $sale->invoice_number,
            'sale_id' => $sale->id,
            'sale_date' => $sale->sale_date,
            'customer' => $sale->customer,
            'items' => $sale->items->map(function ($it) {
                return [
                    'product' => $it->product,
                    'batch_id' => $it->batch_id,
                    'quantity' => $it->quantity,
                    'unit_price' => $it->unit_price,
                    'discount' => $it->discount,
                    'subtotal' => $it->subtotal,
                ];
            }),
            'subtotal' => $sale->subtotal,
            'discount' => $sale->discount,
            'tax' => $sale->tax,
            'grand_total' => $sale->grand_total,
            'order_status' => $sale->order_status,
            'reservations' => $sale->reservations,
        ];

        return response()->json(['invoice' => $invoice], 200);
    }
}
