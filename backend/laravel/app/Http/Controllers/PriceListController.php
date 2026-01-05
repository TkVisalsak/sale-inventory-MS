<?php

namespace App\Http\Controllers;

use App\Models\PriceList;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PriceListController extends Controller
{
    /**
     * Display all price lists
     * Supplier & Category are FILTERS only (via product)
     */
    public function index(Request $request)
    {
        $query = PriceList::with([
            'product.category',
            'product.supplier',
            'creator'
        ]);

        // Filter by supplier (via product)
        if ($request->filled('supplier_id')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('supplier_id', $request->supplier_id);
            });
        }

        // Filter by category (via product)
        if ($request->filled('category_id')) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        return response()->json(
            $query->orderByDesc('created_at')->get()
        );
    }

    /**
     * Get a single price list
     */
    public function show($id)
    {
        return response()->json(
            PriceList::with([
                'product.category',
                'product.supplier',
                'creator'
            ])->findOrFail($id)
        );
    }

    /**
     * Store a new price list
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'product_id'  => 'required|exists:products,id',
                'price'       => 'required|numeric|min:0',
                'old_price'   => 'nullable|numeric|min:0',
                'batch_price' => 'nullable|numeric|min:0',
                'is_active'   => 'boolean',
            ]);

            // Enforce single active price per product
            if ($validated['is_active'] ?? true) {
                PriceList::where('product_id', $validated['product_id'])
                    ->where('is_active', true)
                    ->update(['is_active' => false]);
            }

            $priceList = PriceList::create([
                'product_id'  => $validated['product_id'],
                'price'       => $validated['price'],
                'old_price'   => $validated['old_price'] ?? null,
                'batch_price' => $validated['batch_price'] ?? null,
                'is_active'   => $validated['is_active'] ?? true,
                'created_by'  => Auth::id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Price list created successfully',
                'data' => $priceList->load([
                    'product.category',
                    'product.supplier',
                    'creator'
                ])
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Price list creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create price list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a price list
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'price'       => 'sometimes|required|numeric|min:0',
                'old_price'   => 'nullable|numeric|min:0',
                'batch_price' => 'nullable|numeric|min:0',
                'is_active'   => 'boolean',
            ]);

            $priceList = PriceList::findOrFail($id);

            // If activating, deactivate others
            if (($validated['is_active'] ?? false) && !$priceList->is_active) {
                PriceList::where('product_id', $priceList->product_id)
                    ->where('id', '!=', $id)
                    ->update(['is_active' => false]);
            }

            $priceList->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Price list updated successfully',
                'data' => $priceList->load([
                    'product.category',
                    'product.supplier',
                    'creator'
                ])
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update price list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a price list
     */
    public function destroy($id)
    {
        try {
            PriceList::findOrFail($id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Price list deleted successfully'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete price list',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

