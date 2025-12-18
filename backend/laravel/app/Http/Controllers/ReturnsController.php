<?php

namespace App\Http\Controllers;

use App\Models\ReturnGood;
use Illuminate\Http\Request;

class ReturnsController extends Controller
{
    /**
     * List all returns
     */
    public function index(Request $request)
    {
        $returns = ReturnGood::with(['customer', 'product'])
            ->orderBy('return_date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($returns);
        }

        return view('returns.index', compact('returns'));
    }

    /**
     * Store a new return record
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'return_date'   => 'nullable|date',
                'customer_id'   => 'nullable|exists:customers,id',
                'product_id'    => 'nullable|exists:products,id',
                'quantity'      => 'required|integer|min:1',
                'reason'        => 'nullable|string',
                'refund_amount' => 'nullable|numeric|min:0',
                'status'        => 'nullable|string|max:20',
            ]);

            if (!isset($validated['status'])) {
                $validated['status'] = 'Pending';
            }

            $return = ReturnGood::create($validated);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Return recorded successfully',
                    'data'    => $return->load(['customer', 'product']),
                ], 201);
            }

            return redirect()->back()->with('success', 'Return recorded successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $e->errors(),
                ], 422);
            }

            throw $e;
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to record return: ' . $e->getMessage(),
                ], 500);
            }

            throw $e;
        }
    }

    /**
     * Get a single return record
     */
    public function show(Request $request, $id)
    {
        $return = ReturnGood::with(['customer', 'product'])->findOrFail($id);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($return);
        }

        return view('returns.show', compact('return'));
    }

    /**
     * Edit endpoint (API-friendly)
     */
    public function edit(Request $request, $id)
    {
        $return = ReturnGood::with(['customer', 'product'])->findOrFail($id);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($return);
        }

        return view('returns.edit', compact('return'));
    }

    /**
     * Update a return record
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'return_date'   => 'nullable|date',
                'customer_id'   => 'nullable|exists:customers,id',
                'product_id'    => 'nullable|exists:products,id',
                'quantity'      => 'nullable|integer|min:1',
                'reason'        => 'nullable|string',
                'refund_amount' => 'nullable|numeric|min:0',
                'status'        => 'nullable|string|max:20',
            ]);

            $return = ReturnGood::findOrFail($id);
            $return->update($validated);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Return updated successfully',
                    'data'    => $return->load(['customer', 'product']),
                ]);
            }

            return redirect()->back()->with('success', 'Return updated successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $e->errors(),
                ], 422);
            }

            throw $e;
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update return: ' . $e->getMessage(),
                ], 500);
            }

            throw $e;
        }
    }

    /**
     * Delete a return record
     */
    public function destroy(Request $request, $id)
    {
        try {
            $return = ReturnGood::findOrFail($id);
            $return->delete();

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Return deleted successfully',
                ], 200);
            }

            return redirect()->back()->with('success', 'Return deleted successfully!');
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete return: ' . $e->getMessage(),
                ], 500);
            }

            throw $e;
        }
    }
}


