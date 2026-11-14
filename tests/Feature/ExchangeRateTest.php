<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config(['cache.stores.file' => ['driver' => 'array']]);
    Cache::purge('file');
    Http::preventStrayRequests();
});

/** @return list<array{date: string, base: string, quote: string, rate: float|int}> */
function referenceRateRows(): array
{
    return [
        ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
        ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
    ];
}

it('fetches and caches reference rates without calling the provider again', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response(referenceRateRows())]);
    $this->getJson('/exchange-rates')->assertOk()->assertJsonPath('rates.IDR.rate', 16000)->assertJsonPath('rates.IDR.date', '2026-11-13')->assertJsonPath('stale', false);
    $this->getJson('/exchange-rates')->assertOk()->assertJsonPath('rates.MYR.rate', 4.5);
    Http::assertSentCount(1);
});

it('uses the last successful rates when refreshing fails', function (array $rows, int $status): void {
    Http::fake(['api.frankfurter.dev/*' => Http::sequence()->push(referenceRateRows())->push($rows, $status)]);
    $previous = $this->getJson('/exchange-rates')->json('fetchedAt');
    Cache::store('file')->forget('exchange-rates:fresh');
    $this->getJson('/exchange-rates')->assertOk()->assertJsonPath('stale', true)->assertJsonPath('rates.IDR.rate', 16000)->assertJsonPath('fetchedAt', $previous);
})->with([
    'server error' => [[], 503],
    'incomplete response' => [[['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000]], 200],
    'invalid values' => [[['date' => 'invalid', 'base' => 'USD', 'quote' => 'IDR', 'rate' => -1], ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5]], 200],
    'invalid date' => [[['date' => '2026-02-30', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000], ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5]], 200],
]);

it('leaves manual entry available on a first request network failure', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::failedConnection()]);
    $this->getJson('/exchange-rates')->assertOk()->assertJsonPath('rates', [])->assertJsonPath('fetchedAt', null)->assertJsonPath('stale', true);
});

it('replaces an expired reference with the latest successful response', function (): void {
    $rows = referenceRateRows();
    $rows[0]['rate'] = 17000;
    Http::fake(['api.frankfurter.dev/*' => Http::sequence()->push(referenceRateRows())->push($rows)]);
    $this->getJson('/exchange-rates')->assertOk();
    Cache::store('file')->forget('exchange-rates:fresh');
    $this->getJson('/exchange-rates')->assertOk()->assertJsonPath('rates.IDR.rate', 17000)->assertJsonPath('stale', false);
});
