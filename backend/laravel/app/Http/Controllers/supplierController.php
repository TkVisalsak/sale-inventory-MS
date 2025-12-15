<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    /**
     * Display all suppliers
     */
    public function index(Request $request)
    {
        $suppliers = Supplier::all();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($suppliers);
        }

        return view('suppliers.index', compact('suppliers'));
    }

    /**
     * Show form to create a supplier
     */
    public function create()
    {
        return view('suppliers.create');
    }

    /**
     * Store a new supplier
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'contact_info' => 'nullable|string|max:255',
                'address' => 'nullable|string',
            ]);

            $supplier = Supplier::create($validated);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Supplier created successfully',
                    'data' => $supplier
                ], 201);
            }

            return redirect()
                ->route('suppliers.index')
                ->with('success', 'Supplier created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        }
    }

    /**
     * Show form to edit a supplier
     */
    public function edit(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($supplier);
        }

        return view('suppliers.edit', compact('supplier'));
    }

    /**
     * Update a supplier
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'contact_info' => 'nullable|string|max:255',
            'address' => 'nullable|string',
        ]);

        $supplier = Supplier::findOrFail($id);
        $supplier->update($validated);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($supplier);
        }

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Supplier updated successfully!');
    }

    /**
     * Delete a supplier
     */
    public function destroy(Request $request, $id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Supplier deleted successfully'
            ], 200);
        }

        return redirect()
            ->route('suppliers.index')
            ->with('success', 'Supplier deleted successfully!');
    }
}
