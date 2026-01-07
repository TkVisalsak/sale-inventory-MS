<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'customer_id',
        'user_id',
        'sale_date',
        'subtotal',
        'discount',
        'tax',
        'grand_total',
        'order_status',
        'payment_status',
        'sale_type',
    ];

    protected $casts = [
        'sale_date' => 'datetime',
    ];

    /* ================= RELATIONSHIPS ================= */

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function reservations()
    {
        return $this->hasMany(StockReservation::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
