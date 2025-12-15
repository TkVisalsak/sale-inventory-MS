<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPayable extends Model
{
    use HasFactory;

    protected $table = 'supplier_payables';

    protected $fillable = [
        'supplier_id',
        'amount_due',
        'amount_paid',
        'balance',
        'due_date',
        'status',
        'notes',
        'record_date',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
