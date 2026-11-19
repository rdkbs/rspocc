<?php

declare(strict_types=1);

use App\Models\CreditPriceSnapshot;
use App\Models\ExchangeRateSnapshot;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

function exchangeRateSnapshotsMigration(): object
{
    $migration = require database_path('migrations/2026_11_18_084958_create_exchange_rate_snapshots_table.php');

    if (! is_object($migration)) {
        throw new LogicException('The exchange rate snapshot migration did not return an object.');
    }

    return $migration;
}

it('moves existing credit snapshot rates into dated exchange rate snapshots', function (): void {
    $creditSnapshot = CreditPriceSnapshot::factory()->create([
        'period_end' => '2026-11-18',
        'retrieved_at' => '2026-11-18 17:00:00',
    ]);
    $rates = ['IDR' => ['rate' => 16000, 'date' => '2026-11-17']];

    Schema::table('credit_price_snapshots', function (Blueprint $table): void {
        $table->json('exchange_rates')->nullable();
    });
    DB::table('credit_price_snapshots')->where('id', $creditSnapshot->id)->update([
        'exchange_rates' => json_encode($rates, JSON_THROW_ON_ERROR),
    ]);
    Schema::drop('exchange_rate_snapshots');

    $migration = exchangeRateSnapshotsMigration();
    if (! method_exists($migration, 'up')) {
        throw new LogicException('The exchange rate snapshot migration has no up method.');
    }
    $migration->up();

    $this->assertDatabaseHas('exchange_rate_snapshots', [
        'snapshot_date' => '2026-11-18',
        'rates' => json_encode($rates, JSON_THROW_ON_ERROR),
        'retrieved_at' => '2026-11-18 17:00:00',
    ]);
    expect(Schema::hasColumn('credit_price_snapshots', 'exchange_rates'))->toBeFalse();
});

it('keeps the latest legacy rate when duplicate snapshot dates exist', function (): void {
    $firstSnapshot = CreditPriceSnapshot::factory()->create([
        'period_end' => '2026-11-18',
        'retrieved_at' => '2026-11-18 16:00:00',
    ]);
    Schema::table('credit_price_snapshots', function (Blueprint $table): void {
        $table->dropUnique(['period_end']);
        $table->json('exchange_rates')->nullable();
    });
    $latestSnapshot = CreditPriceSnapshot::factory()->create([
        'period_end' => '2026-11-18',
        'retrieved_at' => '2026-11-18 17:00:00',
    ]);
    $firstRates = ['IDR' => ['rate' => 15000, 'date' => '2026-11-17']];
    $latestRates = ['IDR' => ['rate' => 16000, 'date' => '2026-11-17']];
    DB::table('credit_price_snapshots')->where('id', $firstSnapshot->id)->update([
        'exchange_rates' => json_encode($firstRates, JSON_THROW_ON_ERROR),
    ]);
    DB::table('credit_price_snapshots')->where('id', $latestSnapshot->id)->update([
        'exchange_rates' => json_encode($latestRates, JSON_THROW_ON_ERROR),
    ]);
    Schema::drop('exchange_rate_snapshots');

    $migration = exchangeRateSnapshotsMigration();
    if (! method_exists($migration, 'up')) {
        throw new LogicException('The exchange rate snapshot migration has no up method.');
    }
    $migration->up();

    $this->assertDatabaseHas('exchange_rate_snapshots', [
        'snapshot_date' => '2026-11-18',
        'rates' => json_encode($latestRates, JSON_THROW_ON_ERROR),
        'retrieved_at' => '2026-11-18 17:00:00',
    ]);
    expect(DB::table('exchange_rate_snapshots')->count())->toBe(1);
});

it('refuses rollback when rate history has no matching credit snapshot', function (): void {
    $rates = ['IDR' => ['rate' => 16000, 'date' => '2026-11-17']];
    ExchangeRateSnapshot::factory()->create([
        'snapshot_date' => '2026-11-18',
        'rates' => $rates,
    ]);
    $migration = exchangeRateSnapshotsMigration();
    expect(function () use ($migration): void {
        if (! method_exists($migration, 'down')) {
            throw new LogicException('The exchange rate snapshot migration has no down method.');
        }

        $migration->down();
    })->toThrow(RuntimeException::class)
        ->and(Schema::hasTable('exchange_rate_snapshots'))->toBeTrue()
        ->and(Schema::hasColumn('credit_price_snapshots', 'exchange_rates'))->toBeFalse();
    $this->assertDatabaseHas('exchange_rate_snapshots', [
        'snapshot_date' => '2026-11-18',
        'rates' => json_encode($rates, JSON_THROW_ON_ERROR),
    ]);
});

it('restores matching rate snapshots to the credit snapshot column on rollback', function (): void {
    $creditSnapshot = CreditPriceSnapshot::factory()->create(['period_end' => '2026-11-18']);
    $rates = ['IDR' => ['rate' => 16000, 'date' => '2026-11-17']];
    ExchangeRateSnapshot::factory()->create([
        'snapshot_date' => '2026-11-18',
        'rates' => $rates,
    ]);
    $migration = exchangeRateSnapshotsMigration();

    if (! method_exists($migration, 'down')) {
        throw new LogicException('The exchange rate snapshot migration has no down method.');
    }
    $migration->down();

    expect(Schema::hasTable('exchange_rate_snapshots'))->toBeFalse()
        ->and(Schema::hasColumn('credit_price_snapshots', 'exchange_rates'))->toBeTrue();
    $this->assertDatabaseHas('credit_price_snapshots', [
        'id' => $creditSnapshot->id,
        'exchange_rates' => json_encode($rates, JSON_THROW_ON_ERROR),
    ]);
});
