<?php

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\productsController;
use App\Http\Controllers\BatchesController;
use Illuminate\Support\Facades\Route;

// Category API Routes
Route::get('category-index', [CategoriesController::class, 'categoriesIndex']);
Route::get('category-edit/{id}', [CategoriesController::class, 'categoriesEdit']);
Route::post('category-store', [CategoriesController::class, 'categoriesStore']);
Route::put('category-update/{id}', [CategoriesController::class, 'categoriesUpdate']);
Route::delete('category-delete/{id}', [CategoriesController::class, 'categoriesDelete']);

// Supplier API Routes
Route::get('supplier-index', [SupplierController::class, 'index']);
Route::get('supplier-edit/{id}', [SupplierController::class, 'edit']);
Route::post('supplier-store', [SupplierController::class, 'store']);
Route::put('supplier-update/{id}', [SupplierController::class, 'update']);
Route::delete('supplier-delete/{id}', [SupplierController::class, 'destroy']);

// Products API Routes
Route::get('products', [productsController::class, 'index']);
Route::get('products/{id}', [productsController::class, 'show']);
Route::post('products', [productsController::class, 'store']);
Route::put('products/{id}', [productsController::class, 'update']);
Route::delete('products/{id}', [productsController::class, 'destroy']);

// Batches API Routes
Route::get('batches', [BatchesController::class, 'index']);
Route::get('batches/{id}', [BatchesController::class, 'show']);
Route::post('batches', [BatchesController::class, 'store']);
Route::put('batches/{id}', [BatchesController::class, 'update']);
Route::delete('batches/{id}', [BatchesController::class, 'destroy']);

