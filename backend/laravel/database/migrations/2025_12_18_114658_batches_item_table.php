<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('batch_items', function (Blueprint $table) {
            $table->id('batch_item_id');

            $table->foreignId('batch_id')
                  ->constrained('batches', 'batch_id')
                  ->cascadeOnDelete();

            $table->foreignId('product_id')
                  ->constrained('products')
                  ->restrictOnDelete();

            $table->unsignedInteger('quantity');
            $table->decimal('unit_cost', 15, 2);

            $table->date('expiry_date')->nullable();

            $table->timestamps();

            $table->unique(['batch_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batch_items');
    }
};
