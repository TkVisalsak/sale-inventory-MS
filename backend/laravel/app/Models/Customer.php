<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'customer_type',
        'credit_limit',
        'is_active',
    ];

    public function balance()
    {
        return $this->hasOne(CustomerBalance::class);
    }

    public function returns()
    {
        return $this->hasMany(ReturnGood::class, 'customer_id');
    }
}
