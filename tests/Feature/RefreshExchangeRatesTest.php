<?php

declare(strict_types=1);

use App\Models\ExchangeRateSnapshot;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

it('updates today’s rate snapshot without creating a duplicate', function (): void {
    $this->travelTo('2026-11-18 18:00:00 UTC');
    $snapshot = ExchangeRateSnapshot::factory()->create([
        'snapshot_date' => '2026-11-18',
        'retrieved_at' => '2026-11-18 17:00:00 UTC',
        'rates' => [
            'IDR' => ['rate' => 15000, 'date' => '2026-11-12'],
        ],
    ]);
    $retrievedAt = $snapshot->retrieved_at->toISOString();
    Http::preventStrayRequests();
    Http::fake([
        'api.frankfurter.dev/*' => Http::response([
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'CNY', 'rate' => 7.2],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'EUR', 'rate' => 0.92],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'SGD', 'rate' => 1.35],
        ]),
    ]);

    expect(Artisan::call('exchange-rates:refresh'))->toBe(0);
    Http::assertSentCount(1);
    expect(ExchangeRateSnapshot::count())->toBe(1);
    $snapshot->refresh();

    expect($snapshot->rates)->toBe([
        'IDR' => ['rate' => 16000, 'date' => '2026-11-17'],
        'MYR' => ['rate' => 4.5, 'date' => '2026-11-17'],
        'CNY' => ['rate' => 7.2, 'date' => '2026-11-17'],
        'EUR' => ['rate' => 0.92, 'date' => '2026-11-17'],
        'SGD' => ['rate' => 1.35, 'date' => '2026-11-17'],
    ])->and($snapshot->retrieved_at->toISOString())->toBe('2026-11-18T18:00:00.000000Z')
        ->and($snapshot->retrieved_at->toISOString())->not->toBe($retrievedAt);
});

it('keeps saved exchange rates when Frankfurter is unavailable', function (): void {
    $snapshot = ExchangeRateSnapshot::factory()->create(['snapshot_date' => '2026-11-17']);
    $original = $snapshot->toArray();
    Http::preventStrayRequests();
    Http::fake([
        'api.frankfurter.dev/*' => Http::failedConnection(),
    ]);

    expect(Artisan::call('exchange-rates:refresh'))->toBe(1)
        ->and($snapshot->fresh()?->toArray())->toEqual($original);
});

it('stores rates even when no credit snapshot exists', function (): void {
    Http::preventStrayRequests();
    Http::fake([
        'api.frankfurter.dev/*' => Http::response([
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'CNY', 'rate' => 7.2],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'EUR', 'rate' => 0.92],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
            ['date' => '2026-11-17', 'base' => 'USD', 'quote' => 'SGD', 'rate' => 1.35],
        ]),
    ]);

    expect(Artisan::call('exchange-rates:refresh'))->toBe(0)
        ->and(ExchangeRateSnapshot::count())->toBe(1);
    Http::assertSentCount(1);
});
