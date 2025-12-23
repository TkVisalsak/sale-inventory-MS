<?php

namespace App\Http\Controllers;

use App\Models\ProductBatches;
use App\Models\Batchitem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class BatchesController extends Controller
{
    /**
     * Display all batches
     */
    public function index(Request $request)
    {
        $batches = ProductBatches::with(['supplier', 'items.product'])->get();
        return response()->json($batches);
    }

    /**
     * Get a single batch
     */
    public function show(Request $request, $id)
    {
        $batch = ProductBatches::with(['supplier', 'items.product'])->findOrFail($id);
        return response()->json($batch);
    }

    /**
     * Store a new batch
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'supplier_id' => 'required|exists:supplier,id',
                'invoice_no' => 'required|string|max:100',
                'purchase_date' => 'required|date',
                'status' => 'nullable|in:draft,approved,received',
                'items' => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
                'items.*.expiry_date' => 'nullable|date',
            ]);

            DB::beginTransaction();

            // Calculate total cost from items
            $totalCost = 0;
            foreach ($validated['items'] as $item) {
                $totalCost += $item['quantity'] * $item['unit_cost'];
            }

            // Create batch
            $batch = ProductBatches::create([
                'supplier_id' => $validated['supplier_id'],
                'invoice_no' => $validated['invoice_no'],
                'purchase_date' => $validated['purchase_date'],
                'total_cost' => $totalCost,
                'status' => $validated['status'] ?? 'draft',
                'created_by' => Auth::id() ?? 1, // Fallback to 1 if no auth
            ]);

            // Create batch items
            foreach ($validated['items'] as $item) {
                Batchitem::create([
                    'batch_id' => $batch->batch_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'expiry_date' => $item['expiry_date'] ?? null,
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Batch created successfully',
                'data' => $batch->load(['supplier', 'items.product'])
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
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
                'supplier_id' => 'sometimes|required|exists:supplier,id',
                'invoice_no' => 'sometimes|required|string|max:100',
                'purchase_date' => 'sometimes|required|date',
                'status' => 'nullable|in:draft,approved,received',
                'items' => 'sometimes|required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_cost' => 'required|numeric|min:0',
                'items.*.expiry_date' => 'nullable|date',
            ]);

            DB::beginTransaction();

            $batch = ProductBatches::findOrFail($id);

            // Update batch header if provided
            $batchData = [];
            if (isset($validated['supplier_id'])) {
                $batchData['supplier_id'] = $validated['supplier_id'];
            }
            if (isset($validated['invoice_no'])) {
                $batchData['invoice_no'] = $validated['invoice_no'];
            }
            if (isset($validated['purchase_date'])) {
                $batchData['purchase_date'] = $validated['purchase_date'];
            }
            if (isset($validated['status'])) {
                $batchData['status'] = $validated['status'];
            }

            // If items are provided, update them
            if (isset($validated['items'])) {
                // Delete existing items
                Batchitem::where('batch_id', $batch->batch_id)->delete();

                // Calculate new total cost
                $totalCost = 0;
                foreach ($validated['items'] as $item) {
                    $totalCost += $item['quantity'] * $item['unit_cost'];
                }
                $batchData['total_cost'] = $totalCost;

                // Create new items
                foreach ($validated['items'] as $item) {
                    Batchitem::create([
                        'batch_id' => $batch->batch_id,
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'unit_cost' => $item['unit_cost'],
                        'expiry_date' => $item['expiry_date'] ?? null,
                    ]);
                }
            }

            if (!empty($batchData)) {
                $batch->update($batchData);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Batch updated successfully',
                'data' => $batch->load(['supplier', 'items.product'])
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
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

