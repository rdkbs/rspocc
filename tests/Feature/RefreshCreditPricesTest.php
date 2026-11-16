<?php

declare(strict_types=1);

use App\Models\CreditPriceSnapshot;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use Inertia\Testing\AssertableInertia;

it('stores a complete snapshot and supplies it to the calculator', function (): void {
    Sleep::fake();
    Http::preventStrayRequests();
    Http::fake(['*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => 3.67, 'quantity' => 10])]);
    expect(Artisan::call('credits:refresh-prices'))->toBe(0);
    Http::assertSentCount(6);
    Sleep::assertSequence(array_fill(0, 5, Sleep::for(3)->seconds()));
    expect(CreditPriceSnapshot::count())->toBe(1);
    $this->get('/en')->assertInertia(fn (AssertableInertia $page) => $page->where('priceReference.prices.is.cspo', 3.67));

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and(CreditPriceSnapshot::count())->toBe(1);
});

it('does not save partial snapshots', function (): void {
    Sleep::fake();
    Http::preventStrayRequests();
    Http::fake(['*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => null, 'quantity' => 0])]);
    try {
        $this->artisan('credits:refresh-prices');
        $this->fail('Invalid source data was accepted.');
    } catch (UnexpectedValueException) {
        expect(CreditPriceSnapshot::count())->toBe(0);
    }
});

it('keeps the previous snapshot when a refresh fails', function (): void {
    Sleep::fake();
    $previous = CreditPriceSnapshot::factory()->create();
    Http::preventStrayRequests();
    Http::fake(['*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => null, 'quantity' => 0])]);

    expect(fn () => Artisan::call('credits:refresh-prices'))->toThrow(UnexpectedValueException::class)
        ->and($previous->fresh()?->toArray())->toEqual($previous->toArray());
});

it('keeps the last known price when a credit has no trades', function (): void {
    Sleep::fake();
    $this->travelTo('2027-01-01 01:00:00 UTC');
    $previous = CreditPriceSnapshot::factory()->create([
        'period_start' => '2026-01-01',
        'period_end' => '2026-12-31',
    ]);
    Http::preventStrayRequests();
    Http::fake(['*/credit-trading/price-data*' => Http::response(['lastTradedPrice' => null, 'quantity' => 0])]);

    expect(Artisan::call('credits:refresh-prices'))->toBe(0)
        ->and(CreditPriceSnapshot::count())->toBe(2)
        ->and(CreditPriceSnapshot::query()->orderByDesc('period_end')->firstOrFail()->prices)->toBe($previous->prices)
        ->and(CreditPriceSnapshot::query()->orderByDesc('period_end')->firstOrFail()->period_start)->toBe('2027-01-01');
});
