<?php

declare(strict_types=1);

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Carbon\CarbonImmutable;

it('compares credit types and switches metrics, language and theme', function (): void {
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(10));
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
        'quantity_sold' => '0.1',
        'last_traded_price' => '0.2',
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
        ->click('[role=menuitemradio]:text-is("Last 7 days")')
        ->assertSee('Trading summary')
        ->assertSee('Download daily data (CSV)')
        ->assertScript('document.querySelector("a[download]").download', 'rspo-credit-trends-'.$firstDay->toDateString().'-'.$firstDay->addDays(6)->toDateString().'.csv')
        ->assertScript('decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim().split("\r\n").length', 43)
        ->assertScript('decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim().split("\r\n").filter(row => row.startsWith('.json_encode($firstDay->toDateString().',', JSON_THROW_ON_ERROR).'))', [
            $firstDay->toDateString().',CSPO,0,,0,no_trades',
            $firstDay->toDateString().',IS_CSPO,10,2,20,traded',
            $firstDay->toDateString().',CSPKO,10,2,20,traded',
            $firstDay->toDateString().',IS_CSPKO,10,2,20,traded',
            $firstDay->toDateString().',CSPKE,0.1,0.2,0.02,traded',
            $firstDay->toDateString().',IS_CSPKE,,,,in_progress',
        ])
        ->assertSee('credits sold for USD 140')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tfoot tr > *")).map(cell => cell.querySelector("p")?.textContent ?? cell.textContent)', ['Total traded', 'USD 40.02', 'USD 180', 'USD 220.02'])
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'Standard 18%')
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'IS 82%')
        ->assertSeeIn('#trends-summary-panel tfoot', 'Based on verified trades')
        ->assertPresent('#trends-summary-panel footer#partial-total-note')
        ->assertSee('PRISMA check scheduled or in progress.')
        ->assertSee('Some data is missing or could not be verified.')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel td sup")).every(marker => marker.closest("p") === marker.closest("td").querySelector("p"))', true)
        ->assertMissing('[role=status] details')
        ->assertScript('document.querySelector("#partial-total-note details").open', false)
        ->click('#partial-total-note summary:has-text("PRISMA check scheduled or in progress")')
        ->assertSee('PRISMA check pending or in progress (1)')
        ->assertSee('Waiting for scheduled check (1)')
        ->assertSee('Scheduled PRISMA check:')
        ->assertScript('document.querySelector("#partial-total-note time").textContent.match(/[A-Z][a-z]{2} [0-9]{1,2}, [0-9]{4}/) !== null', true)
        ->click('#partial-total-note summary:has-text("Some data is missing")')
        ->assertSee('No data yet (5)')
        ->assertPresent('#trends-summary-panel svg[role="img"] title:text-is("PRISMA check pending")')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel td:has(svg[role=img])")).every(cell => cell.querySelectorAll("svg[role=img]").length === 1 && getComputedStyle(cell.querySelector("svg[role=img]")).display === "block" && cell.querySelector("p").firstElementChild?.matches("svg[role=img]"))', true)
        ->assertSee($firstDay->format('M j, Y').' (IS CSPKE)')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPKE" && row.textContent.includes("Volume unavailable") && !row.cells[3].textContent.includes("%"))', true)
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPO" && row.textContent.includes("Standard 0%"))', true)
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPKO" && row.cells[3].textContent.split("Standard 50%").length === 2 && row.cells[3].textContent.split("IS 50%").length === 2 && row.cells[3].querySelectorAll("sup").length === 1 && row.cells[3].querySelector("svg[role=img]") === null)', true)
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
        ->click('[role=menuitemradio]:text-is("Custom range")')
        ->fill('#trends-from', $firstDay->toDateString())
        ->fill('#trends-to', $firstDay->addDays(6)->toDateString())
        ->click('Apply dates')
        ->assertScript('new URLSearchParams(location.search).has("from")', true)
        ->click('Summary')
        ->assertSee('credits sold for USD 140')
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
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(16));

    visit('/id/trends')->resize(320, 360)
        ->assertSee('Tren Kredit RSPO')
        ->assertScript('document.querySelector("#partial-total-note").textContent.includes("Belum ada catatan pengecekan") && !document.querySelector("#partial-total-note").textContent.includes("Menunggu jadwal pengecekan") && !document.querySelector("#partial-total-note").textContent.includes("*") && document.querySelector("#trends-summary-panel table").getAttribute("aria-describedby") === "partial-total-note"', true)
        ->click('#trends-period')
        ->assertVisible('#trends-period-menu')
        ->keys('#trends-period-menu [role=menuitemradio][aria-checked=true]', 'Escape')
        ->assertSeeIn('#trends-period', '30 hari terakhir')
        ->assertScript('location.search', '')
        ->click('Harga')
        ->assertSee('Belum ada data untuk periode ini.')
        ->click('Volume')
        ->assertSee('Jumlah kredit terjual per hari')
        ->assertScript('document.documentElement.scrollWidth === window.innerWidth', true)
        ->assertNoJavaScriptErrors();
});

it('rounds displayed trade shares to one hundred percent', function (int|string $standard, int|string $is, string $standardShare, string $isShare): void {
    $day = CarbonImmutable::yesterday('UTC');

    foreach (['CSPO' => $standard, 'IS_CSPO' => $is] as $creditType => $quantity) {
        CreditPriceRetrieval::factory()->create([
            'credit_type' => $creditType,
            'period_start_at' => $day,
            'period_end_at' => $day->endOfDay(),
            'quantity_sold' => $quantity,
            'last_traded_price' => 1,
        ]);
    }

    visit('/en/trends')
        ->assertSeeIn('#trends-summary-panel tbody tr:first-of-type td:last-of-type', 'Standard '.$standardShare)
        ->assertSeeIn('#trends-summary-panel tbody tr:first-of-type td:last-of-type', 'IS '.$isShare)
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'Standard '.$standardShare)
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'IS '.$isShare)
        ->assertNoJavaScriptErrors();
})->with([
    '12.5 percent' => [1, 7, '13%', '87%'],
    '14.5 percent' => [29, 171, '15%', '85%'],
    '14.5 percent with decimal amounts' => ['0.29', '1.71', '15%', '85%'],
]);
