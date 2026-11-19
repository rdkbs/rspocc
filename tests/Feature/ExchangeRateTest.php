<?php

declare(strict_types=1);

use App\Models\CreditPriceSnapshot;
use App\Models\ExchangeRateSnapshot;
use App\Services\FrankfurterExchangeRateProvider;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    Http::preventStrayRequests();
});

/** @return list<array{date: string, base: string, quote: string, rate: float|int}> */
function referenceRateRows(): array
{
    return [
        ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
        ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
        ['date' => '2026-11-12', 'base' => 'USD', 'quote' => 'CNY', 'rate' => 7.2],
        ['date' => '2026-11-11', 'base' => 'USD', 'quote' => 'EUR', 'rate' => 0.92],
        ['date' => '2026-11-11', 'base' => 'USD', 'quote' => 'SGD', 'rate' => 1.35],
    ];
}

it('fetches complete reference rates for scheduled refreshes', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response(referenceRateRows())]);
    $rates = resolve(FrankfurterExchangeRateProvider::class)->fetchUsdRates();
    expect($rates)->not->toBeNull()
        ->and($rates['SGD']['rate'] ?? null)->toBe(1.35);
    Http::assertSentCount(1);
});

it('rejects failed or invalid reference responses', function (array $rows, int $status): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response($rows, $status)]);
    expect(resolve(FrankfurterExchangeRateProvider::class)->fetchUsdRates())->toBeNull();
})->with([
    'server error' => [[], 503],
    'incomplete response' => [array_slice(referenceRateRows(), 0, 3), 200],
    'invalid values' => [[['date' => 'invalid', 'base' => 'USD', 'quote' => 'IDR', 'rate' => -1], ...array_slice(referenceRateRows(), 1)], 200],
    'invalid date' => [[['date' => '2026-02-30', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000], ...array_slice(referenceRateRows(), 1)], 200],
]);

it('handles a reference provider network failure', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::failedConnection()]);
    expect(resolve(FrankfurterExchangeRateProvider::class)->fetchUsdRates())->toBeNull();
});

it('passes the latest available snapshot rates without requesting Frankfurter', function (): void {
    $rates = ['IDR' => ['rate' => 17000, 'date' => '2026-11-14'], 'SGD' => ['rate' => 1.35, 'date' => '2026-11-14']];
    ExchangeRateSnapshot::factory()->create(['snapshot_date' => '2026-11-13', 'rates' => ['IDR' => ['rate' => 16000, 'date' => '2026-11-13']]]);
    ExchangeRateSnapshot::factory()->create(['snapshot_date' => '2026-11-14', 'rates' => $rates]);

    $this->get('/en')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('exchangeRates', $rates));
    Http::assertNothingSent();
});

it('returns no reference rates when no exchange rate snapshots exist', function (): void {
    CreditPriceSnapshot::factory()->create();
    $this->get('/en')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('exchangeRates', []));
    Http::assertNothingSent();
});

it('keeps the calculator available without stored rates', function (): void {
    $this->get('/en')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('exchangeRates', []));
    $this->get('/exchange-rates')->assertNotFound();
    Http::assertNothingSent();
});
