<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('customer_balances', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->primary();
            $table->decimal('outstanding', 12, 2)->default(0);
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::dropIfExists('customer_balances');
    }
};
