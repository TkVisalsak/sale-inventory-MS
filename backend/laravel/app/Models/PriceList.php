<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PriceList extends Model
{
    use HasFactory;

    protected $table = 'price_lists';

    protected $fillable = [
        'product_id',
        'price',
        'old_price',
        'batch_price',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'price'      => 'decimal:2',
        'old_price'  => 'decimal:2',
        'batch_price' => 'decimal:2',
        'is_active'  => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function product()
    {
        return $this->belongsTo(Products::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public static function getCurrentPrice(int $productId): ?float
    {
        return self::active()
            ->where('product_id', $productId)
            ->latest()
            ->value('price');
    }
}
