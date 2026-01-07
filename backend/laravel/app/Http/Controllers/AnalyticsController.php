<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\Customer;

class AnalyticsController extends Controller
{
    // Basic sales analytics: total count and recent list
    public function sales(Request $request)
    {
        $total = Sale::count();
        $recent = Sale::with(['customer','user'])->orderBy('sale_date','desc')->take(10)->get();

        return response()->json(['total' => $total, 'recent' => $recent], 200);
    }

    // Revenue summary (total revenue and simple period sums)
    public function revenue(Request $request)
    {
        $total = (float) Sale::sum('grand_total');

        // optional: group by month for last 6 months
        $monthly = DB::table('sales')
            ->select(DB::raw("DATE_FORMAT(sale_date, '%Y-%m') as month"), DB::raw('SUM(grand_total) as total'))
            ->whereNotNull('sale_date')
            ->groupBy('month')
            ->orderBy('month','desc')
            ->limit(6)
            ->get();

        return response()->json(['total' => $total, 'monthly' => $monthly], 200);
    }

    // Customers analytics
    public function customers(Request $request)
    {
        $total = Customer::count();

        return response()->json(['total' => $total], 200);
    }

    // Top products by quantity sold and revenue
    public function products(Request $request)
    {
        $top = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as sold'),
                DB::raw('SUM(sale_items.subtotal) as value')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('sold')
            ->limit(10)
            ->get();

        return response()->json(['top' => $top], 200);
    }
}
