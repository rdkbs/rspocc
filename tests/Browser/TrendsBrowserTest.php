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
        ->assertSee('Download CSV (UTC)')
        ->assertScript('document.querySelector("a[download]").download', 'rspo-credit-trends-'.$firstDay->toDateString().'-'.$firstDay->addDays(6)->toDateString().'.csv')
        ->assertScript('decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim().split("\r\n").length', 43)
        ->assertScript('decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim().split("\r\n")[0]', 'period_start_utc,period_end_utc,credit_type,credits_sold,min_price_usd,max_price_usd,trade_value_usd,status')
        ->assertScript('decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim().split("\r\n").filter(row => row.startsWith('.json_encode($firstDay->toDateString().'T', JSON_THROW_ON_ERROR).')).map(row => row.split(",").slice(2).join(","))', [
            'CSPO,0,,,0,no_trades',
            'IS_CSPO,10,2,2,20,traded',
            'CSPKO,10,2,2,20,traded',
            'IS_CSPKO,10,2,2,20,traded',
            'CSPKE,0.1,0.2,0.2,0.02,traded',
            'IS_CSPKE,,,,,in_progress',
        ])
        ->assertSee('credits traded for USD 140')
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tfoot tr > *")).map(cell => cell.querySelector("p")?.textContent ?? cell.textContent)', ['Total traded', 'USD 40.02', 'USD 180', 'USD 220.02'])
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'Non-IS RSPO Credits 18%')
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'IS RSPO Credits 82%')
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
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPO" && row.textContent.includes("Non-IS RSPO Credits 0%"))', true)
        ->assertScript('Array.from(document.querySelectorAll("#trends-summary-panel tbody tr")).some(row => row.cells[0].textContent === "CSPKO" && row.cells[3].textContent.includes("Non-IS RSPO Credits") && row.cells[3].textContent.includes("IS RSPO Credits") && (row.cells[3].textContent.match(/50%/g) ?? []).length === 2 && row.cells[3].querySelectorAll("sup").length === 1 && row.cells[3].querySelector("svg[role=img]") === null)', true)
        ->click('Volume')
        ->assertSee('Credits traded per UTC day')
        ->assertScript('Array.from(document.querySelectorAll("#trends-volume-panel section")).filter((section) => section.querySelector("h2")?.textContent === "CSPO").flatMap((card) => Array.from(card.querySelectorAll("dd"), (value) => value.textContent.trim()))', [
            '0',
            '70',
        ])
        ->assertScript('Array.from(document.querySelectorAll("#trends-volume-panel section")).filter((section) => section.querySelector("h2")?.textContent === "CSPKO").flatMap((card) => Array.from(card.querySelectorAll("dd"), (value) => value.textContent.trim()))', [
            '20*',
            '20*',
        ])
        ->assertScript('Array.from(document.querySelectorAll("#trends-volume-panel section")).filter((section) => section.querySelector("h2")?.textContent === "CSPKE").flatMap((card) => Array.from(card.querySelectorAll("dd"), (value) => value.textContent.trim()))', [
            '0.1*',
            'Volume unavailable',
        ])
        ->assertSee('* Totals marked * exclude dates without available volume.')
        ->click('View data table')
        ->assertSee('Time (UTC)')
        ->assertScript('document.querySelector("main details[open] tbody th > span").textContent', $firstDay->addDays(6)->format('M j, Y'))
        ->assertScript('document.querySelector("main details[open] tbody th").textContent.includes("00:00:00.000–23:59:59.999")', true)
        ->assertScript('Array.from(document.querySelectorAll("main details[open] tbody tr")).length === 7', true)
        ->assertScript('Array.from(document.querySelectorAll("main details[open] tbody tr")).every(row => row.cells[2].textContent === "10")', true)
        ->click('Price')
        ->assertSee('Last traded price by UTC day')
        ->assertScript('(() => { const card = Array.from(document.querySelectorAll("#trends-price-panel section")).find((section) => section.querySelector("h2")?.textContent === "CSPO"); return card ? Array.from(card.querySelectorAll("dd")).map((value) => value.textContent.trim()) : null; })()', [
            'No trades',
            'USD 2',
        ])
        ->assertScript('Array.from(document.querySelectorAll("#trends-price-panel section")).some(section => section.querySelector("h2")?.textContent === "CSPKO" && Array.from(section.querySelectorAll(".MuiChartsAxis-directionX .MuiChartsAxis-tickLabel")).some(label => label.textContent === '.json_encode($firstDay->addDay()->format('M j'), JSON_THROW_ON_ERROR).'))', true)
        ->hover('section:has(h2:text-is("CSPKO")) g[data-series] circle >> nth=-1')
        ->assertVisible('[data-testid="price-date-tooltip"]')
        ->assertSeeIn('[data-testid="price-date-tooltip"]', $firstDay->addDays(2)->format('M j, Y'))
        ->assertScript('document.querySelector("[data-testid=price-date-tooltip] hr") !== null', true)
        ->assertScript('document.querySelector(".MuiChartsAxisHighlight-root") !== null', true)
        ->assertScript('Array.from(document.querySelectorAll("[data-testid=price-date-tooltip] li"), row => row.textContent).every(row => row.includes("USD 2"))', true)
        ->click('View data table')
        ->assertSee('No trades')
        ->click('#trends-period')
        ->click('[role=menuitemradio]:text-is("Custom range")')
        ->fill('#trends-from', $firstDay->toDateString())
        ->fill('#trends-to', $firstDay->addDays(6)->toDateString())
        ->click('Apply dates')
        ->assertScript('new URLSearchParams(location.search).has("from")', true)
        ->click('Summary')
        ->assertSee('credits traded for USD 140')
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
        ->hover('section:has(h2:text-is("CSPKO")) svg.MuiChartsSvgLayer-root')
        ->assertVisible('[data-testid="price-date-tooltip"]')
        ->assertSeeIn('[data-testid="price-date-tooltip"]', 'Daily summary')
        ->assertScript('Array.from(document.querySelectorAll("[data-testid=trade-day-summary] > div > div"))
            .map(category => category.textContent)
            .filter(text => text.includes("No trades")).length', 2)
        ->assertScript('getComputedStyle(document.querySelector("[data-testid=price-tooltip-empty]")).color !== getComputedStyle(document.querySelector("[data-testid=price-tooltip-date]")).color', true)
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
        ->assertSee('Jumlah kredit yang diperdagangkan per hari')
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
        ->assertSeeIn('#trends-summary-panel tbody tr:first-of-type td:last-of-type', 'Non-IS RSPO Credits '.$standardShare)
        ->assertSeeIn('#trends-summary-panel tbody tr:first-of-type td:last-of-type', 'IS RSPO Credits '.$isShare)
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'Non-IS RSPO Credits '.$standardShare)
        ->assertSeeIn('#trends-summary-panel tfoot td:last-of-type', 'IS RSPO Credits '.$isShare)
        ->assertNoJavaScriptErrors();
})->with([
    '12.5 percent' => [1, 7, '13%', '87%'],
    '14.5 percent' => [29, 171, '15%', '85%'],
    '14.5 percent with decimal amounts' => ['0.29', '1.71', '15%', '85%'],
]);

it('shows the observed price range for each credit category', function (): void {
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(10));
    $firstDay = CarbonImmutable::yesterday('UTC')->subDays(2);

    foreach ([
        ['CSPO', [2, 5]],
        ['IS_CSPO', [3, 3]],
    ] as [$creditType, $prices]) {
        foreach ($prices as $offset => $price) {
            $day = $firstDay->addDays($offset);
            CreditPriceRetrieval::factory()->create([
                'credit_type' => $creditType,
                'period_start_at' => $day,
                'period_end_at' => $day->addDay()->subMillisecond(),
                'quantity_sold' => 10,
                'last_traded_price' => $price,
                'low_price' => $price,
                'high_price' => $price,
            ]);
        }
    }

    visit('/en/trends?period=last-7-days')
        ->click('Price')
        ->assertScript('(() => { const card = Array.from(document.querySelectorAll("#trends-price-panel section")).find((section) => section.querySelector("h2")?.textContent === "CSPO"); return card ? Array.from(card.querySelectorAll("dd")).map((value) => value.textContent.trim()) : null; })()', [
            'USD 2–5',
            'USD 3',
        ])
        ->assertSee('Observed price in selected date range · USD / credit')
        ->assertSee('No verified prices')
        ->assertNoJavaScriptErrors();
});

it('shows every credit category timestamp under the hovered price date', function (): void {
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(10));
    $day = CarbonImmutable::yesterday('UTC');

    foreach ([
        'CSPO' => [2],
        'IS_CSPO' => [3, 5, 3],
    ] as $creditType => $prices) {
        $lowPrice = min($prices);
        $highPrice = max($prices);
        $root = CreditPriceRetrieval::factory()->create([
            'credit_type' => $creditType,
            'period_start_at' => $day,
            'period_end_at' => $day->endOfDay(),
            'status' => $creditType === 'CSPO'
                ? CreditPriceRetrievalStatus::RESOLVED
                : CreditPriceRetrievalStatus::MIXED,
            'child_quantity_matches' => true,
            'quantity_sold' => $creditType === 'CSPO' ? 40 : 30,
            'last_traded_price' => $prices[array_key_last($prices)],
            'low_price' => $lowPrice,
            'high_price' => $highPrice,
        ]);

        if ($creditType === 'CSPO') {
            continue;
        }

        foreach ([
            [$day->setTime(8, 0), $day->setTime(12, 0), 10, $prices[0]],
            [$day->setTime(12, 0), $day->setTime(16, 0), 10, $prices[1]],
            [$day->setTime(16, 0), $day->addDay()->subMillisecond(), 10, $prices[2]],
        ] as [$start, $end, $quantity, $price]) {
            CreditPriceRetrieval::factory()->for($root, 'parent')->create([
                'credit_type' => $creditType,
                'period_start_at' => $start,
                'period_end_at' => $end,
                'quantity_sold' => $quantity,
                'last_traded_price' => $price,
                'low_price' => $price,
                'high_price' => $price,
            ]);
        }
    }

    visit('/en/trends?'.http_build_query([
        'from' => $day->toDateString(),
        'to' => $day->toDateString(),
    ]))
        ->assertScript('(() => {
            const csv = decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim();
            const rows = csv.split("\r\n").slice(1).map(row => row.split(","));
            return {
                allTimestampsAreUtc: rows.every(row => row[0].endsWith("Z") && row[1].endsWith("Z")),
                intervals: rows.filter(row => ["CSPO", "IS_CSPO"].includes(row[2])).map(row => row.slice(0, 2)),
                values: rows.filter(row => ["CSPO", "IS_CSPO"].includes(row[2])).map(row => row.slice(2).join(",")),
            };
        })()', [
            'allTimestampsAreUtc' => true,
            'intervals' => [
                [$day->format('Y-m-d').'T00:00:00.000Z', $day->format('Y-m-d').'T23:59:59.999Z'],
                [$day->format('Y-m-d').'T08:00:00.000Z', $day->format('Y-m-d').'T12:00:00.000Z'],
                [$day->format('Y-m-d').'T12:00:00.000Z', $day->format('Y-m-d').'T16:00:00.000Z'],
                [$day->format('Y-m-d').'T16:00:00.000Z', $day->format('Y-m-d').'T23:59:59.999Z'],
            ],
            'values' => [
                'CSPO,40,2,2,80,traded',
                'IS_CSPO,10,3,3,30,traded',
                'IS_CSPO,10,5,5,50,traded',
                'IS_CSPO,10,3,3,30,traded',
            ],
        ])
        ->click('Price')
        ->resize(320, 800)
        ->hover('section:has(h2:text-is("CSPO")) svg.MuiChartsSvgLayer-root')
        ->assertVisible('[data-testid="price-date-tooltip"]')
        ->assertSeeIn('[data-testid="price-date-tooltip"]', $day->format('M j, Y'))
        ->assertScript('(() => {
            const card = Array.from(document.querySelectorAll("#trends-price-panel section")).find(section => section.querySelector("h2")?.textContent === "CSPO");
            const markers = Array.from(card.querySelectorAll("g[data-series] circle"));
            return markers.length === 4 && new Set(markers.map(marker => marker.getAttribute("transform"))).size === 4;
        })()', true)
        ->assertScript('(() => {
            const { left, right } = document.querySelector("[data-testid=price-date-tooltip]").getBoundingClientRect();
            return left >= 0 && right <= window.innerWidth;
        })()', true)
        ->assertScript('(() => {
            const rows = Array.from(document.querySelectorAll("[data-testid=price-date-tooltip] li"), row => row.textContent);
            return rows.length === 4
                && rows.filter(row => row.trim().startsWith("Non-IS RSPO Credits")).length === 1
                && rows.filter(row => row.trim().startsWith("IS RSPO Credits")).length === 3
                && rows.some(row => row.includes("08:00:00.000–12:00:00.000") && row.includes("USD 3"))
                && rows.some(row => row.includes("12:00:00.000–16:00:00.000") && row.includes("USD 5"))
                && rows.some(row => row.includes("16:00:00.000–23:59:59.999") && row.includes("USD 3"));
        })()', true)
        ->assertScript('Array.from(document.querySelectorAll("[data-testid=price-date-tooltip] li"))
            .filter(row => row.textContent.includes("10 credits")).length', 3)
        ->assertSeeIn('[data-testid="trade-day-summary"]', '30 credits traded')
        ->assertSeeIn('[data-testid="trade-day-summary"]', 'USD 3–5 / credit')
        ->resize(320, 400)
        ->hover('section:has(h2:text-is("CSPO")) svg.MuiChartsSvgLayer-root')
        ->assertScript('(async () => {
            const tooltip = document.querySelector("[data-testid=price-date-tooltip]");
            const chart = tooltip.closest("section").querySelector("svg.MuiChartsSvgLayer-root");
            const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 80 });
            chart.dispatchEvent(wheel);
            await new Promise(requestAnimationFrame);
            const scrolled = wheel.defaultPrevented && tooltip.scrollTop > 0;
            tooltip.scrollTop = tooltip.scrollHeight;
            const atBottom = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 80 });
            chart.dispatchEvent(atBottom);
            return scrolled && atBottom.defaultPrevented;
        })()', true)
        ->click('Volume')
        ->hover('section:has(h2:text-is("CSPO")) svg.MuiChartsSvgLayer-root')
        ->assertScript('Array.from(document.querySelectorAll("[data-testid=volume-date-tooltip] li"))
            .filter(row => row.textContent.includes("10 credits")).length', 3)
        ->assertSeeIn('[data-testid="trade-day-summary"]', '30 credits traded')
        ->assertScript('Array.from(document.querySelectorAll("[data-testid=volume-date-tooltip] li"))
            .filter(row => row.textContent.includes("USD 3 / credit")).length', 2)
        ->assertNoJavaScriptErrors();

    visit('/en/trends?period=last-365-days')
        ->click('Price')
        ->resize(320, 800)
        ->hover('section:has(h2:text-is("CSPO")) g[data-series] circle:nth-of-type(3)')
        ->assertSeeIn('[data-testid="price-date-tooltip"]', $day->format('M j, Y'));
});

it('sums every trade interval when the daily volume is unavailable', function (): void {
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(10));
    $day = CarbonImmutable::yesterday('UTC');
    $root = CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPO',
        'period_start_at' => $day,
        'period_end_at' => $day->addDay()->subMillisecond(),
        'quantity_sold' => null,
        'last_traded_price' => null,
    ]);

    foreach ([
        [$day, $day->addHours(12)->subMillisecond(), 12],
        [$day->addHours(12), $day->addDay()->subMillisecond(), 8],
    ] as [$start, $end, $quantity]) {
        CreditPriceRetrieval::factory()->for($root, 'parent')->create([
            'credit_type' => 'CSPO',
            'period_start_at' => $start,
            'period_end_at' => $end,
            'quantity_sold' => $quantity,
            'last_traded_price' => 2,
            'low_price' => 2,
            'high_price' => 2,
        ]);
    }

    visit('/en/trends?'.http_build_query([
        'from' => $day->toDateString(),
        'to' => $day->toDateString(),
    ]))
        ->click('Volume')
        ->assertScript('Array.from(document.querySelectorAll("#trends-volume-panel section")).filter((section) => section.querySelector("h2")?.textContent === "CSPO").flatMap((card) => Array.from(card.querySelectorAll("dd"), (value) => value.textContent.trim()))', [
            '20',
            'Volume unavailable',
        ])
        ->hover('section:has(h2:text-is("CSPO")) svg.MuiChartsSvgLayer-root')
        ->assertSeeIn('[data-testid="volume-date-tooltip"]', '20 credits traded')
        ->assertNoJavaScriptErrors();
});

it('marks equal-priced mixed intervals as partial in the timestamp export', function (): void {
    $this->travelTo(CarbonImmutable::today('UTC')->addMinutes(10));
    $day = CarbonImmutable::yesterday('UTC');
    $root = CreditPriceRetrieval::factory()->create([
        'credit_type' => 'CSPO',
        'period_start_at' => $day,
        'period_end_at' => $day->addDay()->subMillisecond(),
        'status' => CreditPriceRetrievalStatus::UNRESOLVED,
        'quantity_sold' => 20,
        'low_price' => 3,
        'high_price' => 3,
        'last_traded_price' => 3,
    ]);

    foreach ([
        [$day, $day->addHours(12)],
        [$day->addHours(12), $day->addDay()->subMillisecond()],
    ] as [$start, $end]) {
        CreditPriceRetrieval::factory()->for($root, 'parent')->create([
            'credit_type' => 'CSPO',
            'period_start_at' => $start,
            'period_end_at' => $end,
            'status' => CreditPriceRetrievalStatus::UNRESOLVED,
            'quantity_sold' => 10,
            'low_price' => 3,
            'high_price' => 3,
            'error_message' => CreditPriceRetrieval::MIXED_MILLISECOND_MESSAGE,
        ]);
    }

    visit('/en/trends?'.http_build_query([
        'from' => $day->toDateString(),
        'to' => $day->toDateString(),
    ]))
        ->assertScript('(() => {
            const csv = decodeURIComponent(document.querySelector("a[download]").href.split(",")[1]).trim();
            return csv.split("\r\n").filter(row => row.split(",")[2] === "CSPO").map(row => row.split(",").slice(2).join(","));
        })()', [
            'CSPO,10,3,3,,partial_trade_value',
            'CSPO,10,3,3,,partial_trade_value',
        ])
        ->assertNoJavaScriptErrors();
});
