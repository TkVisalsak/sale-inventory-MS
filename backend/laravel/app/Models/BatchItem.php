<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batchitem extends Model
{
    use HasFactory;

    protected $table = 'batch_items';

    protected $primaryKey = 'batch_item_id';

    protected $fillable = [
        'batch_id',
        'product_id',
        'quantity',
        'unit_cost',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
        'quantity'    => 'integer',
        'unit_cost'   => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function batch()
    {
        return $this->belongsTo(ProductBatches::class, 'batch_id');
    }

    public function product()
    {
        return $this->belongsTo(Products::class, 'product_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Computed helpers (safe, optional)
    |--------------------------------------------------------------------------
    */

    public function getSubtotalAttribute(): float
    {
        return (float) ($this->quantity * $this->unit_cost);
    }
}
