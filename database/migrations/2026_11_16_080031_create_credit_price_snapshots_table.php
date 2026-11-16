<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_price_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->date('period_start');
            $table->date('period_end')->unique();
            $table->json('prices');
            $table->timestamp('retrieved_at');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('credit_price_snapshots');
    }
};
