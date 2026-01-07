<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;

class PurchaseOrderController extends Controller
{
    /**
     * Return a list of purchase orders with supplier and items.
     */
    public function index(): JsonResponse
    {
        $orders = PurchaseOrder::with([
            'supplier',
            'items.product',
        ])->orderByDesc('created_at')->get();

        return response()->json($orders);
    }

    /**
     * Show a single purchase order with items and supplier.
     */
    public function show(int $id): JsonResponse
    {
        $order = PurchaseOrder::with(['supplier', 'items.product'])->findOrFail($id);
        return response()->json($order);
    }
}
