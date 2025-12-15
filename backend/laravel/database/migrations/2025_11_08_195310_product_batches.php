<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('batch_number', 100)->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('buy_price', 10, 2)->nullable();
            $table->decimal('market_price', 10, 2)->nullable();
            $table->integer('current_quantity')->default(0);
            $table->string('warehouse_location', 255)->nullable();
            $table->date('received_date')->default(DB::raw('CURRENT_DATE'));
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('product_batches');
    }
};
