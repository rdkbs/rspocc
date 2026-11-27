<?php

declare(strict_types=1);

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia;

it('renders a localized Trends social preview image', function (string $language, string $title, string $description): void {
    $this->travelTo('2026-11-27 00:00:00 UTC');

    $page = $this->get('/'.$language.'/trends')->assertOk()
        ->assertSeeHtml('<meta property="og:title" content="'.$title.'">')
        ->assertSeeHtml('<meta property="og:description" content="'.$description.'">')
        ->assertSeeHtml('<meta property="og:image:width" content="1200">')
        ->assertSeeHtml('<meta property="og:image:height" content="630">')
        ->assertSeeHtml('<meta name="twitter:card" content="summary_large_image">');

    $content = $page->getContent();
    if (! is_string($content) || preg_match('/<meta property="og:image" content="([^"]+)"/', $content, $matches) !== 1) {
        $this->fail('The Trends page must provide its social preview image URL.');
    }

    $response = $this->get(html_entity_decode($matches[1], ENT_QUOTES));
    $response->assertOk()->assertHeader('Content-Type', 'image/png');
    $image = $response->getContent();
    if (! is_string($image)) {
        $this->fail('The preview image response must contain image bytes.');
    }

    $size = getimagesizefromstring($image);
    expect($size)->not->toBeFalse();
    if ($size !== false) {
        expect($size)->toMatchArray([0 => 1200, 1 => 630]);
    }
})->with([
    ['en', 'RSPO Credit Trends · Oct 28–Nov 26, 2026', 'Recorded trade value: Non-IS unavailable; IS unavailable. Unverified values are not included in these totals.'],
    ['id', 'Tren Kredit RSPO · 28 Okt–26 Nov 2026', 'Nilai tercatat: Non-IS belum tersedia; IS belum tersedia. Nilai yang belum terverifikasi tidak masuk ke total.'],
]);

it('shows zero trade value only when PRISMA confirms no trades', function (): void {
    $this->travelTo('2026-01-02 00:00:00 UTC');
    $date = CarbonImmutable::parse('2026-01-01 00:00:00', 'UTC');

    foreach (['CSPO', 'IS_CSPO'] as $creditType) {
        CreditPriceRetrieval::factory()->create([
            'credit_type' => $creditType,
            'period_start_at' => $date,
            'period_end_at' => $date->addDay()->subMillisecond(),
            'status' => CreditPriceRetrievalStatus::NO_TRADES,
            'quantity_sold' => 0,
            'low_price' => null,
            'high_price' => null,
            'last_traded_price' => null,
        ]);
    }

    $page = $this->get('/en/trends?from=2026-01-01&to=2026-01-01')
        ->assertOk()
        ->assertSeeHtml('<meta property="og:description" content="Recorded trade value: Non-IS USD 0; IS USD 0. Unverified values are not included in these totals.">');

    $content = $page->getContent();
    if (! is_string($content) || preg_match('/<meta property="og:image" content="([^"]+)"/', $content, $matches) !== 1) {
        $this->fail('The Trends page must provide its signed social preview image URL.');
    }

    $this->get(html_entity_decode($matches[1], ENT_QUOTES))->assertOk();
});

it('builds a range-specific Trends preview from the verified values', function (): void {
    $this->travelTo('2026-01-01 00:00:00 UTC');
    $date = CarbonImmutable::parse('2025-01-01 00:00:00', 'UTC');

    foreach ([['CSPO', 1000, 3.2], ['IS_CSPO', 2500, 4.5]] as [$creditType, $quantity, $price]) {
        CreditPriceRetrieval::factory()->create([
            'credit_type' => $creditType,
            'period_start_at' => $date,
            'period_end_at' => $date->addDay()->subMillisecond(),
            'status' => CreditPriceRetrievalStatus::RESOLVED,
            'quantity_sold' => $quantity,
            'low_price' => $price,
            'high_price' => $price,
            'last_traded_price' => $price,
        ]);
    }

    $shareUrl = config()->string('app.url').'/id/trends?period=custom&from=2025-01-01&to=2025-12-31';
    $page = $this->get('/id/trends?from=2025-01-01&period=custom&to=2025-12-31')
        ->assertOk()
        ->assertSeeHtml('<meta property="og:title" content="Tren Kredit RSPO · 1 Jan–31 Des 2025">')
        ->assertSeeHtml('<meta property="og:description" content="Nilai tercatat: Non-IS USD 3.200; IS USD 11.250. Nilai yang belum terverifikasi tidak masuk ke total.">')
        ->assertSeeHtml('<meta property="og:url" content="'.str_replace('&', '&amp;', $shareUrl).'">');

    $content = $page->getContent();
    if (! is_string($content) || preg_match('/<meta property="og:image" content="([^"]+)"/', $content, $matches) !== 1) {
        $this->fail('The Trends page must provide its signed social preview image URL.');
    }

    $imageUrl = html_entity_decode($matches[1], ENT_QUOTES);
    $imageResponse = $this->get($imageUrl)->assertOk()->assertHeader('Content-Type', 'image/png');
    $image = $imageResponse->getContent();
    $genericImage = $this->get('/id/trends-share-preview.png')->assertOk()->getContent();
    expect($image)->toBeString()->not->toBe($genericImage);

    $imagePath = parse_url($imageUrl, PHP_URL_PATH);
    $imageQuery = parse_url($imageUrl, PHP_URL_QUERY);
    parse_str(is_string($imageQuery) ? $imageQuery : '', $query);
    $query['nonIs'] = '1';
    $this->get((is_string($imagePath) ? $imagePath : '').'?'.http_build_query($query))
        ->assertForbidden();
});

it('accepts full decimal precision in range-specific preview values', function (): void {
    $this->travelTo('2026-01-02 00:00:00 UTC');
    $date = CarbonImmutable::parse('2026-01-01 00:00:00', 'UTC');

    CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPO',
        'period_start_at' => $date,
        'period_end_at' => $date->addDay()->subMillisecond(),
        'status' => CreditPriceRetrievalStatus::RESOLVED,
        'quantity_sold' => '0.12345678',
        'low_price' => '0.23456789',
        'high_price' => '0.23456789',
        'last_traded_price' => '0.23456789',
    ]);

    $page = $this->get('/en/trends?from=2026-01-01&to=2026-01-01')->assertOk();
    $content = $page->getContent();
    if (! is_string($content) || preg_match('/<meta property="og:image" content="([^"]+)"/', $content, $matches) !== 1) {
        $this->fail('The Trends page must provide its signed social preview image URL.');
    }

    $imageUrl = html_entity_decode($matches[1], ENT_QUOTES);
    $imageQuery = parse_url($imageUrl, PHP_URL_QUERY);
    parse_str(is_string($imageQuery) ? $imageQuery : '', $query);

    expect($query['nonIs'] ?? null)->toBe('0.0289589963907942');
    $this->get($imageUrl)->assertOk()->assertHeader('Content-Type', 'image/png');
});

it('counts a matching shared-boundary quantity once while keeping verified sales', function (): void {
    $day = CarbonImmutable::parse('2026-10-27', 'UTC');
    $this->travelTo($day->addDay());

    $root = CreditPriceRetrieval::factory()->create([
        'credit_type' => 'IS_CSPKO',
        'period_start_at' => $day,
        'period_end_at' => $day->addDay()->subMillisecond(),
        'status' => CreditPriceRetrievalStatus::UNRESOLVED,
        'quantity_sold' => 572,
        'low_price' => 100,
        'high_price' => 130,
        'last_traded_price' => 130,
    ]);

    $boundary = $day->addHours(17);
    $factory = CreditPriceRetrieval::factory()->state(['credit_type' => $root->credit_type]);
    foreach ([
        [$day, $boundary, $boundary->subMillisecond(), $boundary, $day, $boundary->subMillisecond(), 4],
        [$boundary, $root->period_end_at, $boundary, $boundary->addMillisecond(), $boundary->addMillisecond(), $root->period_end_at, 6],
    ] as [$start, $end, $mixedStart, $mixedEnd, $verifiedStart, $verifiedEnd, $verifiedQuantity]) {
        $branch = $factory->for($root, 'parent')->create([
            'period_start_at' => $start,
            'period_end_at' => $end,
            'status' => CreditPriceRetrievalStatus::UNRESOLVED,
            'quantity_sold' => 562 + $verifiedQuantity,
        ]);
        $factory->for($branch, 'parent')->create([
            'period_start_at' => $mixedStart,
            'period_end_at' => $mixedEnd,
            'status' => CreditPriceRetrievalStatus::UNRESOLVED,
            'quantity_sold' => 562,
            'low_price' => 100,
            'high_price' => 130,
            'error_message' => CreditPriceRetrieval::MIXED_MILLISECOND_MESSAGE,
        ]);
        $factory->for($branch, 'parent')->create([
            'period_start_at' => $verifiedStart,
            'period_end_at' => $verifiedEnd,
            'quantity_sold' => $verifiedQuantity,
            'last_traded_price' => 100,
        ]);
    }

    $this->get('/en/trends?from=2026-10-27&to=2026-10-27')
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('excludedDates.couldNotVerify', 0)
            ->where('partialSpending', [[
                'start' => '2026-10-27 17:00:00.000',
                'end' => '2026-10-27 17:00:00.000',
                'quantity' => 562,
                'low' => 100,
                'high' => 130,
                'creditType' => 'IS_CSPKO',
            ]])
            ->has('tradeIntervals.IS_CSPKO.2026-10-27', 3)
            ->where('tradeIntervals.IS_CSPKO.2026-10-27.0.start', '2026-10-27 17:00:00.000')
            ->where('tradeIntervals.IS_CSPKO.2026-10-27.0.end', '2026-10-27 17:00:00.000')
            ->where('tradeIntervals.IS_CSPKO.2026-10-27.0.quantity', 562)
            ->where('tradeIntervals.IS_CSPKO.2026-10-27.0.low', 100)
            ->where('tradeIntervals.IS_CSPKO.2026-10-27.0.high', 130)
            ->where('trades.IS_CSPKO.2026-10-27.volume', 572)
            ->where('trades.IS_CSPKO.2026-10-27.pricedVolume', 10)
            ->where('trades.IS_CSPKO.2026-10-27.price', 130)
            ->where('trades.IS_CSPKO.2026-10-27.tradeValue', 1000)
            ->where('trades.IS_CSPKO.2026-10-27.partialTradeValue', true));

    $root->update(['quantity_sold' => 573]);

    $this->get('/en/trends?from=2026-10-27&to=2026-10-27')
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->has('excludedDates.couldNotVerify', 1)
            ->has('partialSpending', 0)
            ->where('tradeIntervals.IS_CSPKO.2026-10-27', [[
                'start' => '2026-10-27 00:00:00.000',
                'end' => '2026-10-27 23:59:59.999',
                'quantity' => 573,
                'low' => 100,
                'high' => 130,
                'csvValues' => ['573', '100', '130', null],
            ]])
            ->has('trades', 0));
});

it('shows complete trading days and distinguishes zero trades from missing data', function (): void {
    $this->travelTo('2026-01-04 12:00:00 UTC');

    foreach ([
        [1, CreditPriceRetrievalStatus::NO_TRADES, null, 0, null],
        [2, CreditPriceRetrievalStatus::MIXED, true, 500, 4],
        [3, CreditPriceRetrievalStatus::MIXED, null, 200, 6],
        [4, CreditPriceRetrievalStatus::RESOLVED, null, 150, 8],
    ] as [$day, $status, $matches, $quantity, $price]) {
        $start = CarbonImmutable::parse(sprintf('2026-01-%02d', $day), 'UTC');
        $root = CreditPriceRetrieval::factory()->create([
            'period_start_at' => $start,
            'period_end_at' => $start->addDay()->subMillisecond(),
            'status' => $status,
            'child_quantity_matches' => $matches,
            'quantity_sold' => $quantity,
            'last_traded_price' => $price,
        ]);

        if ($matches === true) {
            $midday = $start->addHours(12);
            CreditPriceRetrieval::factory()->for($root, 'parent')->create([
                'period_start_at' => $start,
                'period_end_at' => $midday->subMillisecond(),
                'quantity_sold' => 200,
                'last_traded_price' => 3,
            ]);
            CreditPriceRetrieval::factory()->for($root, 'parent')->create([
                'period_start_at' => $midday,
                'period_end_at' => $root->period_end_at,
                'quantity_sold' => 300,
                'last_traded_price' => 5,
            ]);
        }
    }

    CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPO',
        'period_start_at' => CarbonImmutable::parse('2026-01-02', 'UTC'),
        'period_end_at' => CarbonImmutable::parse('2026-01-02 23:59:59.999', 'UTC'),
        'status' => CreditPriceRetrievalStatus::UNRESOLVED,
        'quantity_sold' => null,
        'last_traded_price' => null,
    ]);

    $this->get('/trends')->assertRedirect('/id/trends');
    $this->get('/en/trends?from=2026-01-01&to=2026-01-03')->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
        ->component('trends')
        ->where('lang', 'en')
        ->where('endDate', '2026-01-03')
        ->where('excludedDates.inProgress', [[
            'date' => '2026-01-03',
            'creditTypes' => ['IS_CSPO'],
        ]])
        ->where('excludedDates.couldNotVerify', [[
            'date' => '2026-01-02',
            'creditTypes' => ['CSPO'],
        ]])
        ->has('trades.IS_CSPO', 2)
        ->where('trades.IS_CSPO.2026-01-01.volume', 0)
        ->where('trades.IS_CSPO.2026-01-01.price', null)
        ->where('trades.IS_CSPO.2026-01-01.tradeValue', 0)
        ->where('trades.IS_CSPO.2026-01-02.price', 5)
        ->where('trades.IS_CSPO.2026-01-02.volume', 500)
        ->where('trades.IS_CSPO.2026-01-02.tradeValue', 2100));

    $this->get('/en/trends?from=2026-01-01&to=2026-01-01')
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('startDate', '2026-01-01')
            ->where('endDate', '2026-01-01')
            ->has('trades.IS_CSPO', 1));

    $this->get('/en/trends?from=2023-01-01&to=2023-01-01')
        ->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('firstDate', '2023-01-01')
            ->where('startDate', '2023-01-01')
            ->where('endDate', '2023-01-01'));

    $this->getJson('/en/trends?from=2022-12-31&to=2022-12-31')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('from');

    $this->getJson('/en/trends?period=custom&from=&to=')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['from', 'to']);

    $this->getJson('/en/trends?from=2026-01-02&to=2026-01-01')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('to');
});

it('uses UTC calendar boundaries for date presets', function (): void {
    $this->travelTo('2026-02-11 00:15:00 UTC');

    foreach ([
        'week' => ['2026-02-02', '2026-02-08'],
        'month' => ['2026-01-01', '2026-01-31'],
        'three-months' => ['2025-11-11', '2026-02-10'],
        '90-days' => ['2025-11-13', '2026-02-10'],
        'six-months' => ['2025-08-11', '2026-02-10'],
        '180-days' => ['2025-08-15', '2026-02-10'],
        'year' => ['2025-01-01', '2025-12-31'],
    ] as $period => [$start, $end]) {
        $this->get('/en/trends?period='.$period)->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('period', $period)
            ->where('startDate', $start)
            ->where('endDate', $end));
    }
});

it('includes the immediately preceding UTC periods at rollover', function (): void {
    $this->travelTo('2029-01-01 00:15:00 UTC');

    foreach ([
        'week' => ['2028-12-25', '2028-12-31'],
        'month' => ['2028-12-01', '2028-12-31'],
        'year' => ['2028-01-01', '2028-12-31'],
    ] as $period => [$start, $end]) {
        $this->get('/en/trends?period='.$period)->assertInertia(fn (AssertableInertia $page): AssertableInertia => $page
            ->where('startDate', $start)
            ->where('endDate', $end));
    }
});
