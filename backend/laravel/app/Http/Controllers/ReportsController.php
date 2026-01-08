<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    /**
     * Stock report: aggregated quantity per product with batch details.
     * GET /api/reports/stock
     * Optional query params: product_id, supplier_id, category_id
     */
    public function stockReport(Request $request)
    {
        $query = DB::table('batch_items')
            ->join('batches', 'batch_items.batch_id', '=', 'batches.batch_id')
            ->join('products', 'batch_items.product_id', '=', 'products.id')
            ->select(
                'products.id as product_id',
                'products.name as product_name',
                'products.barcode as barcode',
                'products.unit as unit',
                'batch_items.batch_item_id',
                'batch_items.batch_id',
                'batches.purchase_date',
                'batch_items.quantity',
                'batch_items.unit_cost'
            );

        if ($request->has('product_id') && $request->query('product_id')) {
            $query->where('batch_items.product_id', $request->query('product_id'));
        }

        if ($request->has('supplier_id') && $request->query('supplier_id')) {
            $query->where('batches.supplier_id', $request->query('supplier_id'));
        }

        if ($request->has('category_id') && $request->query('category_id')) {
            $query->where('products.category_id', $request->query('category_id'));
        }

        // date range filters on batch purchase_date
        if ($request->has('from') && $request->query('from')) {
            $query->where('batches.purchase_date', '>=', $request->query('from'));
        }

        if ($request->has('to') && $request->query('to')) {
            $query->where('batches.purchase_date', '<=', $request->query('to'));
        }

        $rows = $query->orderBy('products.name')->orderBy('batches.purchase_date', 'desc')->get();

        // Group by product
        $grouped = [];
        foreach ($rows as $r) {
            $pid = $r->product_id;
            if (!isset($grouped[$pid])) {
                $grouped[$pid] = [
                    'product_id' => $pid,
                    'product_name' => $r->product_name,
                    'barcode' => $r->barcode,
                    'unit' => $r->unit,
                    'total_quantity' => 0,
                    'batches' => [],
                ];
            }

            $grouped[$pid]['total_quantity'] += (int) $r->quantity;
            $grouped[$pid]['batches'][] = [
                'batch_item_id' => $r->batch_item_id,
                'batch_id' => $r->batch_id,
                'purchase_date' => $r->purchase_date,
                'quantity' => (int) $r->quantity,
                'unit_cost' => (float) $r->unit_cost,
            ];
        }

        // Return as array
        $result = array_values($grouped);

        return response()->json($result);
    }
}
