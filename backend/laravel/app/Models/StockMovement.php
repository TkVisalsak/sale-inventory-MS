<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'movement_type',
        'quantity',
        'reference',
        'movement_date',
        'note',
    ];

    public function batch()
    {
        return $this->belongsTo(ProductBatches::class);
    }
}
