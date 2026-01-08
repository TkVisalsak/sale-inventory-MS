<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    // List all payments
    public function index()
    {
        return Payment::with(['sale.customer','user'])->orderBy('created_at','desc')->get();
    }

    // Create a payment for a sale
    public function store(Request $request, $saleId)
    {
        $sale = Sale::find($saleId);
        if (!$sale) return response()->json(['message' => 'Sale not found'], 404);

        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|max:30',
            'reference' => 'nullable|string|max:100',
            'paid_at' => 'nullable|date',
            'user_id' => 'required|exists:users,id',
        ]);

        return DB::transaction(function() use ($data, $sale) {
            $payment = Payment::create([
                'sale_id' => $sale->id,
                'user_id' => $data['user_id'],
                'payment_method' => $data['payment_method'],
                'amount' => $data['amount'],
                'reference' => $data['reference'] ?? null,
                'paid_at' => $data['paid_at'] ?? now(),
            ]);

            // Recalculate sale payment status
            $paid = $sale->payments()->sum('amount') + $payment->amount;
            if ($paid >= $sale->grand_total) {
                $sale->payment_status = 'paid';
            } elseif ($paid > 0) {
                $sale->payment_status = 'partial';
            } else {
                $sale->payment_status = 'unpaid';
            }
            $sale->save();

            return response()->json($payment->load(['sale','user']), 201);
        });
    }

    // Get payments for a given customer
    public function byCustomer($customerId)
    {
        return Payment::whereHas('sale', function($q) use ($customerId) {
            $q->where('customer_id', $customerId);
        })->with(['sale','user'])->orderBy('paid_at','desc')->get();
    }

    // Compute outstanding balance for a customer
    public function customerBalance($customerId)
    {
        // total sales for customer
        $sales = Sale::where('customer_id', $customerId)->get();
        $total = $sales->sum('grand_total');

        // total payments for those sales
        $paymentSum = Payment::whereIn('sale_id', $sales->pluck('id')->toArray())->sum('amount');

        $outstanding = max(0, $total - $paymentSum);

        return response()->json([
            'customer_id' => (int)$customerId,
            'total_invoiced' => (float)$total,
            'total_paid' => (float)$paymentSum,
            'outstanding' => (float)$outstanding,
        ]);
    }
}
