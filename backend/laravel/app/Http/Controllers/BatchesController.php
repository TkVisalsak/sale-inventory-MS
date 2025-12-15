<?php

namespace App\Http\Controllers;

use App\Models\ProductBatches;
use Illuminate\Http\Request;

class BatchesController extends Controller
{
    /**
     * Display all batches
     */
    public function index(Request $request)
    {
        $batches = ProductBatches::with(['product'])->get();
        return response()->json($batches);
    }

    /**
     * Get a single batch
     */
    public function show(Request $request, $id)
    {
        $batch = ProductBatches::with(['product'])->findOrFail($id);
        return response()->json($batch);
    }

    /**
     * Store a new batch
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'batch_number' => 'nullable|string|max:100',
                'expiration_date' => 'nullable|date',
                'buy_price' => 'nullable|numeric|min:0',
                'market_price' => 'nullable|numeric|min:0',
                'current_quantity' => 'required|integer|min:0',
                'warehouse_location' => 'nullable|string|max:255',
                'received_date' => 'nullable|date',
            ]);

            $batch = ProductBatches::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Batch created successfully',
                'data' => $batch->load(['product'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create batch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a batch
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'product_id' => 'sometimes|required|exists:products,id',
                'batch_number' => 'nullable|string|max:100',
                'expiration_date' => 'nullable|date',
                'buy_price' => 'nullable|numeric|min:0',
                'market_price' => 'nullable|numeric|min:0',
                'current_quantity' => 'sometimes|required|integer|min:0',
                'warehouse_location' => 'nullable|string|max:255',
                'received_date' => 'nullable|date',
            ]);

            $batch = ProductBatches::findOrFail($id);
            $batch->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Batch updated successfully',
                'data' => $batch->load(['product'])
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update batch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a batch
     */
    public function destroy(Request $request, $id)
    {
        try {
            $batch = ProductBatches::findOrFail($id);
            $batch->delete();

            return response()->json([
                'success' => true,
                'message' => 'Batch deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete batch: ' . $e->getMessage()
            ], 500);
        }
    }
}

