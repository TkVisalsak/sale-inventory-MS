<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('batch_id')->nullable();

            $table->string('movement_type', 10); // in / out / adjust
            $table->integer('quantity');

            $table->text('reference')->nullable();
            $table->timestamp('movement_date')->useCurrent();
            $table->text('note')->nullable();

            $table->timestamps();

            $table->foreign('batch_id')
                  ->references('batch_id')
                  ->on('batches')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
