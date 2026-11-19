<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Builder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exchange_rate_snapshots', function (Blueprint $table): void {
            $table->id();
            $table->date('snapshot_date')->unique();
            $table->json('rates');
            $table->timestamp('retrieved_at');
        });

        foreach (DB::table('credit_price_snapshots')->whereNotNull('exchange_rates')->orderBy('id')->cursor() as $snapshot) {
            DB::table('exchange_rate_snapshots')->updateOrInsert(
                ['snapshot_date' => $snapshot->period_end],
                ['rates' => $snapshot->exchange_rates, 'retrieved_at' => $snapshot->retrieved_at],
            );
        }

        Schema::table('credit_price_snapshots', function (Blueprint $table): void {
            $table->dropColumn('exchange_rates');
        });
    }

    public function down(): void
    {
        $hasUnmatchedSnapshots = DB::table('exchange_rate_snapshots as rates')
            ->whereNotExists(function (Builder $query): void {
                $query->selectRaw('1')
                    ->from('credit_price_snapshots as prices')
                    ->whereColumn('prices.period_end', 'rates.snapshot_date');
            })
            ->exists();

        if ($hasUnmatchedSnapshots) {
            throw new RuntimeException('Cannot roll back exchange rate snapshots without losing rate history that has no matching credit price snapshot.');
        }

        Schema::table('credit_price_snapshots', function (Blueprint $table): void {
            $table->json('exchange_rates')->nullable();
        });

        foreach (DB::table('exchange_rate_snapshots')->orderBy('snapshot_date')->cursor() as $snapshot) {
            DB::table('credit_price_snapshots')
                ->where('period_end', $snapshot->snapshot_date)
                ->update(['exchange_rates' => $snapshot->rates]);
        }

        Schema::dropIfExists('exchange_rate_snapshots');
    }
};
