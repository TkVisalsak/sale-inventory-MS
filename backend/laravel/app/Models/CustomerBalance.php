<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerBalance extends Model
{
    use HasFactory;

    protected $primaryKey = 'customer_id';
    public $incrementing = false;

    protected $fillable = ['customer_id', 'outstanding'];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
