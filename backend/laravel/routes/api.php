<?php

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\productsController;
use App\Http\Controllers\BatchesController;
use App\Http\Controllers\customersController;
use App\Http\Controllers\ReturnsController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\StockMovementsController;
use App\Http\Controllers\PriceListController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\StockReservationController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\ReportsController;
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

// Customers API Routes
Route::get('customers', [customersController::class, 'index']);
Route::get('customers/{id}', [customersController::class, 'show']);
Route::get('customers-edit/{id}', [customersController::class, 'edit']); // optional separate edit endpoint
Route::post('customers', [customersController::class, 'store']);
Route::put('customers/{id}', [customersController::class, 'update']);
Route::delete('customers/{id}', [customersController::class, 'destroy']);

// Returns API Routes
Route::get('returns', [ReturnsController::class, 'index']);
Route::get('returns/{id}', [ReturnsController::class, 'show']);
Route::get('returns-edit/{id}', [ReturnsController::class, 'edit']); // optional separate edit endpoint
Route::post('returns', [ReturnsController::class, 'store']);
Route::put('returns/{id}', [ReturnsController::class, 'update']);
Route::delete('returns/{id}', [ReturnsController::class, 'destroy']);

// Purchase Requests API Routes
Route::get('purchase-requests', [PurchaseRequestController::class, 'index']);
Route::get('purchase-requests/{id}', [PurchaseRequestController::class, 'show']);
Route::post('purchase-requests', [PurchaseRequestController::class, 'store']);

// Purchase Orders API Routes
Route::get('purchase-orders', [PurchaseOrderController::class, 'index']);
Route::get('purchase-orders/{id}', [PurchaseOrderController::class, 'show']);

// Sales API Routes (Sale orders / invoices)
Route::get('sales', [SalesController::class, 'index']);
Route::get('sales/{id}', [SalesController::class, 'show']);
Route::post('sales', [SalesController::class, 'store']);
Route::put('sales/{id}', [SalesController::class, 'update']);
Route::post('sales/{id}/invoice', [SalesController::class, 'generateInvoice']);

// Stock reservation endpoints for inventory_user to confirm
Route::get('stock-reservations', [StockReservationController::class, 'index']);
Route::put('stock-reservations/{id}', [StockReservationController::class, 'update']);

// Analytics endpoints used by frontend
Route::get('analytics/sales', [AnalyticsController::class, 'sales']);
Route::get('analytics/revenue', [AnalyticsController::class, 'revenue']);
Route::get('analytics/customers', [AnalyticsController::class, 'customers']);
Route::get('analytics/products', [AnalyticsController::class, 'products']);

// Stock Adjustments (Stock Movements) API Routes
Route::get('stock-adjustments', [StockMovementsController::class, 'adjustmentsIndex']);
Route::post('stock-adjustments', [StockMovementsController::class, 'storeAdjustment']);

// Reports
Route::get('reports/stock', [ReportsController::class, 'stockReport']);

// Price List API Routes
Route::get('price-lists', [PriceListController::class, 'index']);
Route::get('price-lists/{id}', [PriceListController::class, 'show']);
Route::post('price-lists', [PriceListController::class, 'store']);
Route::put('price-lists/{id}', [PriceListController::class, 'update']);
Route::delete('price-lists/{id}', [PriceListController::class, 'destroy']);

// Authentication Routes (with session support) 
Route::post('login', [AuthController::class, 'login']);
Route::middleware('auth')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);
});

