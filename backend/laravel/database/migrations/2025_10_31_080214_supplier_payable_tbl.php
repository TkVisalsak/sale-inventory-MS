<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('supplier_payables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('supplier')->onDelete('cascade');
            $table->decimal('amount_due', 12, 2)->default(0.00);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('balance', 12, 2)->default(0.00);
            $table->date('due_date')->nullable();
            $table->string('status', 20)->default('Unpaid'); // Unpaid, Partial, Paid
            $table->text('notes')->nullable();
            $table->date('record_date')->default(DB::raw('CURRENT_DATE'));
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('supplier_payables');
    }
};
