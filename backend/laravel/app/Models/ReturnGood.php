<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnGood extends Model
{
    use HasFactory;

    protected $table = 'returns';

    protected $fillable = [
        'return_date',
        'customer_id',
        'product_id',
        'quantity',
        'reason',
        'refund_amount',
        'status',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function product()
    {
        return $this->belongsTo(Products::class);
    }
}
