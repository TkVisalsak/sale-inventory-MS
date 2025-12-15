<?php

use App\Http\Controllers\CategoriesController;
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

Route::get('/home', [CategoriesController::class, 'categoriesIndex'])->name('home');

// Category Routes
Route::get('category-index', [CategoriesController::class, 'categoriesIndex'])->name('category.index');
Route::get('category-create', [CategoriesController::class, 'categoriesCreate'])->name('category.create');
Route::post('category-store', [CategoriesController::class, 'categoriesStore'])->name('category.store');
Route::get('category-edit/{id}', [CategoriesController::class, 'categoriesEdit'])->name('category.edit');
Route::put('category-update/{id}', [CategoriesController::class, 'categoriesUpdate'])->name('category.update');
Route::delete('category-delete/{id}', [CategoriesController::class, 'categoriesDelete'])->name('category.delete');
