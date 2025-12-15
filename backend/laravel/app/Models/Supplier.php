<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'supplier';
    protected $fillable = ['name', 'contact_info', 'address'];

    public function products()
    {
        return $this->hasMany(Products::class);
    }

    public function purchaseRequests()
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function payables()
    {
        return $this->hasMany(SupplierPayable::class);
    }
}
