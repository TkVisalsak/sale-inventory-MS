<?php

// legacy filename: payment.php
// Replaced by App\\Models\\Payment (file: Payment.php) to conform with PSR-4 autoloading.
// This file intentionally left blank.
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'payment_method',
        'amount',
        'reference',
        'paid_at',
        'user_id',
        'due_date',
    ];

    protected $casts = [
        'paid_at' => 'datetime',
        'due_date' => 'date',
    ];

    /* ================= RELATIONSHIPS ================= */

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
