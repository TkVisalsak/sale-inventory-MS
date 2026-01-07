<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('batches', function (Blueprint $table) {
            $table->id('batch_id');

            $table->foreignId('supplier_id')
                ->constrained('supplier')
                ->restrictOnDelete();

            $table->string('invoice_no', 100);
            $table->date('purchase_date');

            $table->decimal('total_cost', 15, 2)->default(0);

            $table->enum('status', ['draft', 'approved', 'received'])
                  ->default('draft');

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->restrictOnDelete();

            $table->timestamps();

            $table->unique(['supplier_id', 'invoice_no']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('batches');
    }
};
