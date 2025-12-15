<?php

use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

// Home / Pages
Route::get('/', function () {
    return view('index');
})->name('home');

Route::get('about', function () {
    return view('about');
})->name('about');

Route::get('contact', function () {
    return view('contact');
})->name('contact');

Auth::routes();

// Dashboard / Home after login
Route::get('/home', [SupplierController::class, 'index'])->name('home');

// ==============================
// Supplier Routes
// ==============================
Route::get('supplier-index', [SupplierController::class, 'index'])->name('supplier.index');
Route::get('supplier-create', [SupplierController::class, 'create'])->name('supplier.create');
Route::post('supplier-store', [SupplierController::class, 'store'])->name('supplier.store');
Route::get('supplier-edit/{id}', [SupplierController::class, 'edit'])->name('supplier.edit');
Route::put('supplier-update/{id}', [SupplierController::class, 'update'])->name('supplier.update');
Route::delete('supplier-delete/{id}', [SupplierController::class, 'destroy'])->name('supplier.delete');
