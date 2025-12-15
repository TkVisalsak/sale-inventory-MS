<?php

namespace App\Http\Controllers;

use App\Models\Products;
use Illuminate\Http\Request;

class productsController extends Controller
{
    /**
     * Display all products
     */
    public function index(Request $request)
    {
        $products = Products::with(['category', 'supplier'])->get();
        return response()->json($products);
    }

    /**
     * Get a single product
     */
    public function show(Request $request, $id)
    {
        $product = Products::with(['category', 'supplier'])->findOrFail($id);
        return response()->json($product);
    }

    /**
     * Store a new product
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'barcode' => 'nullable|string|max:100',
                'supplier_id' => 'nullable|exists:supplier,id',
                'category_id' => 'required|exists:categories,id',
                'unit' => 'nullable|string|max:50',
                'description' => 'nullable|string',
                'availability' => 'boolean',
            ]);

            // Set default availability if not provided
            if (!isset($validated['availability'])) {
                $validated['availability'] = true;
            }

            $product = Products::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product->load(['category', 'supplier'])
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
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a product
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'barcode' => 'nullable|string|max:100',
                'supplier_id' => 'nullable|exists:supplier,id',
                'category_id' => 'sometimes|required|exists:categories,id',
                'unit' => 'nullable|string|max:50',
                'description' => 'nullable|string',
                'availability' => 'boolean',
            ]);

            $product = Products::findOrFail($id);
            $product->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product->load(['category', 'supplier'])
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
                'message' => 'Failed to update product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a product
     */
    public function destroy(Request $request, $id)
    {
        try {
            $product = Products::findOrFail($id);
            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete product: ' . $e->getMessage()
            ], 500);
        }
    }
}
