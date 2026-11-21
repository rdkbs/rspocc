<?php

declare(strict_types=1);

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Carbon\CarbonImmutable;

it('compares credit types and switches metrics, language and theme', function (): void {
    $firstDay = CarbonImmutable::yesterday('UTC')->subDays(6);

    foreach (range(0, 6) as $offset) {
        $day = $firstDay->addDays($offset);
        CreditPriceRetrieval::factory()->create([
            'period_start_at' => $day,
            'period_end_at' => $day->addDay()->subMillisecond(),
            'quantity_sold' => 10,
        ]);
        CreditPriceRetrieval::factory()->create([
            'credit_type' => 'CSPO',
            'period_start_at' => $day,
            'period_end_at' => $day->addDay()->subMillisecond(),
            'status' => CreditPriceRetrievalStatus::NO_TRADES,
            'quantity_sold' => 0,
            'last_traded_price' => null,
        ]);
    }

    foreach (range(0, 2) as $offset) {
        $day = $firstDay->addDays($offset);
        foreach (['CSPKO', 'IS_CSPKO'] as $creditType) {
            $noTrades = $offset === 1;
            CreditPriceRetrieval::factory()->create([
                'credit_type' => $creditType,
                'period_start_at' => $day,
                'period_end_at' => $day->addDay()->subMillisecond(),
                'status' => $noTrades ? CreditPriceRetrievalStatus::NO_TRADES : CreditPriceRetrievalStatus::RESOLVED,
                'quantity_sold' => $noTrades ? 0 : 10,
                'last_traded_price' => $noTrades ? null : 2,
            ]);
        }
    }

    CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPKE',
        'period_start_at' => $firstDay,
        'period_end_at' => $firstDay->addDay()->subMillisecond(),
    ]);

    CreditPriceRetrieval::factory()->create([
        'credit_type' => 'IS_CSPKE',
        'period_start_at' => $firstDay,
        'period_end_at' => $firstDay->addDay()->subMillisecond(),
        'status' => CreditPriceRetrievalStatus::PENDING,
    ]);

    visit('/en')
        ->click('Trends')
        ->assertPathIs('/en/trends')
        ->assertSee('RSPO Credit Trends')
        ->assertSee('CSPKO')
        ->assertSee('CSPKE')
        ->click('#trends-period')
        ->click('Last 7 days')
        ->assertSee('Trading summary')
        ->assertSee('USD140')
        ->assertSee('In progress (1)')
        ->assertScript('document.querySelector("[role=status] details").open', false)
        ->click('[role=status] details summary')
        ->assertSee($firstDay->format('M j, Y').' (IS CSPKE)')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPKE" && row.textContent.includes("Volume unavailable") && !row.textContent.includes("IS 0%"))', true)
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPO" && row.textContent.includes("Standard 0%"))', true)
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPKO" && !row.cells[3].textContent.includes("%") && row.cells[3].textContent.split("Partial total").length === 3)', true)
        ->click('Volume')
        ->assertSee('Credits sold per UTC day')
        ->click('View data table')
        ->assertScript('Array.from(document.querySelectorAll("main details[open] tbody tr")).length === 7', true)
        ->assertScript('Array.from(document.querySelectorAll("main details[open] tbody tr")).every(row => row.cells[2].textContent === "10")', true)
        ->click('Price')
        ->assertSee('Last traded price by UTC day')
        ->assertScript('Array.from(document.querySelectorAll("#trends-price-panel section")).some(section => section.querySelector("h2")?.textContent === "CSPKO" && Array.from(section.querySelectorAll(".MuiChartsAxis-directionX .MuiChartsAxis-tickLabel")).some(label => label.textContent === '.json_encode($firstDay->addDay()->format('M j'), JSON_THROW_ON_ERROR).'))', true)
        ->hover('section:has(h2:text-is("CSPKO")) g[data-series] circle >> nth=-1')
        ->assertSee($firstDay->addDays(2)->format('M j').' · 2 USD (Standard + Independent Smallholder (IS))')
        ->click('View data table')
        ->assertSee('No trades')
        ->click('#trends-period')
        ->click('Custom range')
        ->fill('#trends-from', $firstDay->toDateString())
        ->fill('#trends-to', $firstDay->addDays(6)->toDateString())
        ->click('Apply dates')
        ->assertScript('new URLSearchParams(location.search).has("from")', true)
        ->click('Summary')
        ->assertSee('USD140')
        ->click('Dark mode')
        ->assertSee('Light mode')
        ->click('header [role=combobox]')
        ->click('Indonesia')
        ->assertPathIs('/id/trends')
        ->assertSee('Tren Kredit RSPO')
        ->assertNoJavaScriptErrors();

    $noTradeDay = $firstDay->addDay();
    visit('/en/trends?'.http_build_query([
        'from' => $noTradeDay->toDateString(),
        'to' => $noTradeDay->toDateString(),
    ]))
        ->click('Price')
        ->assertSee('No trades on the selected dates.')
        ->assertScript('Array.from(document.querySelectorAll("#trends-price-panel section"))
            .find(section => section.querySelector("h2")?.textContent === "CSPKO")
            ?.querySelector(".MuiChartsAxis-directionX .MuiChartsAxis-tickLabel")?.textContent', $noTradeDay->format('M j'))
        ->assertNoJavaScriptErrors();
});

it('keeps the trends page usable on mobile without trading data', function (): void {
    visit('/id/trends')->on()->mobile()
        ->assertSee('Tren Kredit RSPO')
        ->click('Harga')
        ->assertSee('Belum ada data untuk periode ini.')
        ->click('Volume')
        ->assertSee('Jumlah kredit terjual per hari')
        ->assertScript('document.documentElement.scrollWidth === window.innerWidth', true)
        ->assertNoJavaScriptErrors();
});
