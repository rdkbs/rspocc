<?php

declare(strict_types=1);

use App\Models\CreditPriceSnapshot;
use App\Models\ExchangeRateSnapshot;
use App\Services\PrismaCreditPriceProvider;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Inertia\Testing\AssertableInertia;

it('holds the shared PRISMA request lock while the request is sent', function (): void {
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => function (Request $request) {
            expect(Cache::lock('prisma:request-slot', 50)->get())->toBeFalse();

            return Http::response(['quantity' => 0]);
        },
    ]);

    $response = resolve(PrismaCreditPriceProvider::class)->fetchRange(
        'CSPO',
        CarbonImmutable::parse('2026-01-01 00:00:00', 'UTC'),
        CarbonImmutable::parse('2026-01-01 23:59:59.999', 'UTC'),
    );

    expect($response->successful())->toBeTrue();
    Http::assertSentCount(1);
});

it('stores a complete snapshot and supplies it to the calculator', function (): void {
    Sleep::fake();
    $this->travelTo('2026-11-19 00:00:00 UTC');
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => 3.67, 'quantity' => 10]),
    ]);
    expect(Artisan::call('credits:refresh-prices'))->toBe(0);
    Http::assertSentCount(6);
    Http::assertSent(function (Request $request): bool {
        $queryString = parse_url($request->url(), PHP_URL_QUERY);
        if (! is_string($queryString)) {
            return false;
        }
        parse_str($queryString, $query);

        return ($query['startDate'] ?? null) === '2026-01-01T00:00:00.000Z'
            && ($query['endDate'] ?? null) === '2026-11-18T23:59:59.999Z';
    });
    Sleep::assertSequence(array_fill(0, 5, Sleep::for(3)->seconds()));
    expect(CreditPriceSnapshot::count())->toBe(1);
    $this->get('/en')->assertInertia(fn (AssertableInertia $page) => $page->where('priceReference.prices.is.cspo', 3.67));

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and(CreditPriceSnapshot::count())->toBe(1);
});

it('does not save an incomplete initial snapshot when a credit has no trade', function (): void {
    Sleep::fake();
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::sequence()
            ->push(['lastTradedPrice' => 3.67, 'quantity' => 10])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0]),
    ]);

    expect(fn () => Artisan::call('credits:refresh-prices'))->toThrow(UnexpectedValueException::class)
        ->and(CreditPriceSnapshot::count())->toBe(0);
    Http::assertSentCount(6);
});

it('keeps the previous snapshot when a refresh fails', function (): void {
    Sleep::fake();
    $previous = CreditPriceSnapshot::factory()->create();
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => null, 'quantity' => 10]),
    ]);

    expect(fn () => Artisan::call('credits:refresh-prices'))->toThrow(UnexpectedValueException::class)
        ->and($previous->fresh()?->toArray())->toEqual($previous->toArray());
});

it('keeps previous prices for credits with no trades and updates traded credits', function (): void {
    Sleep::fake();
    $this->travelTo('2027-01-02 00:00:00 UTC');
    $previous = CreditPriceSnapshot::factory()->create([
        'period_start' => '2026-01-01',
        'period_end' => '2026-12-31',
        'prices' => [
            'standard' => ['cspo' => 1.1, 'cspko' => 2.2, 'cspke' => 3.3],
            'is' => ['cspo' => 4.4, 'cspko' => 5.5, 'cspke' => 6.6],
        ],
    ]);
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::sequence()
            ->push(['lastTradedPrice' => 7.7, 'quantity' => 10])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0])
            ->push(['lastTradedPrice' => null, 'quantity' => 0]),
    ]);

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and(CreditPriceSnapshot::count())->toBe(2)
        ->and(CreditPriceSnapshot::query()->orderByDesc('period_end')->firstOrFail()->prices)->toBe([
            'standard' => ['cspo' => 7.7, 'cspko' => 2.2, 'cspke' => 3.3],
            'is' => ['cspo' => 4.4, 'cspko' => 5.5, 'cspke' => 6.6],
        ])
        ->and(CreditPriceSnapshot::query()->orderByDesc('period_end')->firstOrFail()->period_start)->toBe('2027-01-01');
});

it('refreshes credit prices without requesting exchange rates', function (): void {
    Sleep::fake();
    $this->travelTo('2026-11-19 00:00:00 UTC');
    CreditPriceSnapshot::factory()->create(['period_end' => '2026-11-18']);
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => 3.67, 'quantity' => 10]),
    ]);

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and(ExchangeRateSnapshot::count())->toBe(0);
    Http::assertSentCount(6);
});

it('preserves saved exchange rates while refreshing credit prices', function (): void {
    Sleep::fake();
    $this->travelTo('2026-11-19 00:00:00 UTC');
    CreditPriceSnapshot::factory()->create(['period_end' => '2026-11-18']);
    $today = today('UTC');
    $exchangeRates = [
        'IDR' => ['rate' => 16000, 'date' => '2026-11-13'],
        'MYR' => ['rate' => 4.5, 'date' => '2026-11-13'],
        'CNY' => ['rate' => 7.2, 'date' => '2026-11-12'],
        'EUR' => ['rate' => 0.92, 'date' => '2026-11-11'],
        'SGD' => ['rate' => 1.35, 'date' => '2026-11-11'],
    ];
    $snapshot = ExchangeRateSnapshot::factory()->create([
        'snapshot_date' => $today->toDateString(),
        'rates' => $exchangeRates,
    ]);
    Http::preventStrayRequests();
    Http::fake([
        '*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => 3.67, 'quantity' => 10]),
    ]);

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and($snapshot->fresh()?->rates)->toBe($exchangeRates);
    Http::assertSentCount(6);
});
