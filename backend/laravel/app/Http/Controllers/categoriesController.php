<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoriesController extends Controller
{
    /**
     * Display all categories
     */
    public function categoriesIndex(Request $request)
    {
        $categories = Category::all();
        
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($categories);
        }
        
        return view('categories.index', compact('categories'));
    }

    /**
     * Show form to create a category
     */
    public function categoriesCreate()
    {
        return view('categories.create');
    }

    /**
     * Store a new category
     */
    public function categoriesStore(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
            ]);

            $category = Category::create($validated);

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Category created successfully',
                    'data' => $category
                ], 201);
            }

            return redirect()->route('category.index')->with('success', 'Category created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors()
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create category: ' . $e->getMessage()
                ], 500);
            }
            throw $e;
        }
    }

    /**
     * Show form to edit a category
     */
    public function categoriesEdit(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($category);
        }
        
        return view('categories.edit', compact('category'));
    }

    /**
     * Update a category
     */
    public function categoriesUpdate(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $category = Category::findOrFail($id);
        $category->update($validated);

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json($category);
        }

        return redirect()->route('category.index')->with('success', 'Category updated successfully!');
    }

    /**
     * Delete a category
     */
    public function categoriesDelete(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json(['message' => 'Category deleted successfully'], 200);
        }

        return redirect()->route('category.index')->with('success', 'Category deleted successfully!');
    }
}
