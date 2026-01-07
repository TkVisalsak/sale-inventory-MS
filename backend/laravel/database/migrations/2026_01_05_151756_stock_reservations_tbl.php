<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')
                  ->constrained('sales')
                  ->cascadeOnDelete();

            $table->foreignId('product_id')
                  ->constrained('products')
                  ->restrictOnDelete();

            // allow null batch_id when reservation isn't tied to a specific batch
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->foreign('batch_id')
                ->references('batch_id') // match batches PK
                ->on('batches')
                ->onDelete('restrict');

            $table->integer('quantity');

            // statuses used by application logic
            $table->enum('status', ['pending', 'reserved', 'rejected', 'cancelled'])->default('pending');

            $table->timestamp('expires_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
    }
};
