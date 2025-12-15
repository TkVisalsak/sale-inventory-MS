<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductBatches extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'batch_number',
        'expiration_date',
        'buy_price',
        'market_price',
        'current_quantity',
        'warehouse_location',
        'received_date',
    ];

    public function product()
    {
        return $this->belongsTo(Products::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'batch_id');
    }
}
