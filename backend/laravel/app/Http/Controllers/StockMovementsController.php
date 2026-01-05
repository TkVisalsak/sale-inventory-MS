<?php

namespace App\Http\Controllers;

use App\Models\ProductBatches;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockMovementsController extends Controller
{
    /**
     * List stock adjustments (movement_type = 'adjust').
     */
    public function adjustmentsIndex(): JsonResponse
    {
        $adjustments = StockMovement::with([
                'batch.supplier',
                'batch.items.product',
            ])
            ->whereRaw('LOWER(movement_type) = ?', ['adjust'])
            ->orderByDesc('movement_date')
            ->get();

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
            'quantity'  => ['required', 'integer', 'not_in:0'],
            'reference' => ['nullable', 'string'],
            'note'      => ['nullable', 'string'],
        ]);

        // We only record the movement here. Actual stock recomputation (if any)
        // should be handled by reporting logic that sums batch items and movements.

        $movement = StockMovement::create([
            'batch_id'      => $validated['batch_id'],
            'movement_type' => 'adjust',
            'quantity'      => $validated['quantity'],
            'reference'     => $validated['reference'] ?? null,
            'note'          => $validated['note'] ?? null,
            // movement_date defaults to current timestamp in migration
        ]);

        return response()->json([
            'message' => 'Stock adjustment recorded successfully',
            'data'    => $movement->load('batch.supplier'),
        ], 201);
    }
}


