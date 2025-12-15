<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number', 20);
            $table->foreignId('supplier_id')->constrained('supplier')->onDelete('cascade');
            $table->string('requested_by', 100);
            $table->date('request_date')->default(DB::raw('CURRENT_DATE'));
            $table->date('expected_delivery')->nullable();
            $table->string('priority', 20)->default('Medium');
            $table->decimal('amount', 12, 2)->default(0.00);
            $table->string('status', 20)->default('Draft');
            $table->text('items_requested')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('purchase_requests');
    }
};
