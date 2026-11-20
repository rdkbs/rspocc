<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('credit_price_retrievals', function (Blueprint $table): void {
            $table->id();
            $table->string('credit_type', 16);
            $table->dateTime('period_start_at', 3);
            $table->dateTime('period_end_at', 3);
            $table->foreignId('parent_id')->nullable()->constrained('credit_price_retrievals')->restrictOnDelete();
            $table->string('status', 16);
            $table->decimal('quantity_sold', 24, 8)->nullable();
            $table->decimal('low_price', 24, 8)->nullable();
            $table->decimal('high_price', 24, 8)->nullable();
            $table->decimal('last_traded_price', 24, 8)->nullable();
            $table->boolean('child_quantity_matches')->nullable();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->longText('response_body')->nullable();
            $table->char('response_sha256', 64)->nullable();
            $table->text('error_message')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('retrieved_at', 3)->nullable();
            $table->timestamps(3);

            $table->unique(['credit_type', 'period_start_at', 'period_end_at'], 'credit_price_retrievals_range_unique');
            $table->index(['parent_id', 'status', 'period_start_at', 'updated_at'], 'credit_price_retrievals_parent_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_price_retrievals');
    }
};
