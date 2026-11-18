<?php

declare(strict_types=1);

use App\Models\CreditPriceSnapshot;
use Illuminate\Support\Facades\Http;

it('keeps edits off the URL and preserves inputs when switching language', function (): void {
    Http::fake([
        'api.frankfurter.dev/*' => Http::response([
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'CNY', 'rate' => 7.2],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'EUR', 'rate' => 0.92],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'SGD', 'rate' => 1.35],
        ]),
    ]);

    $page = visit('/en');

    $page->fill('FFB volume', '1234')
        ->assertValue('FFB volume', '1234')
        ->assertScript('location.search', '')
        ->assertScript('location.pathname !== "/"', true);

    $page->click('header [role=combobox]')->click('Indonesia')
        ->assertPathIs('/id')
        ->assertValue('Volume TBS', '1.234');
    $page->assertScript('document.cookie.includes("rspocc_language=id")', true)
        ->navigate('/')
        ->assertPathIs('/id')
        ->navigate('/en')
        ->assertPathIs('/en')
        ->assertNoJavaScriptErrors();
});

it('restores calculator edits after returning from the FAQ', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);
    $page = visit('/en');
    $page->fill('FFB volume', '1234')->fill('CSPO Price', '12.5')
        ->click('header a[href="/en/faq"]')
        ->assertPathIs('/en/faq')
        ->back()
        ->assertPathIs('/en')
        ->assertValue('FFB volume', '1,234')
        ->assertValue('CSPO Price', '12.5')
        ->assertScript('location.search', '')
        ->assertNoJavaScriptErrors();
});

it('shares current inputs in a query URL that restores the calculation', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);
    $page = visit('/en');
    $page->fill('FFB volume', '1234')->fill('CSPO Price', '12.5');
    $page->script('Object.defineProperty(navigator, "share", { configurable: true, value: async (data) => { window.sharedUrl = data.url; } });');
    $page->click('Share the result')
        ->assertScript('typeof window.sharedUrl', 'string')
        ->assertScript('location.search', '');

    $url = $page->script('window.sharedUrl');
    if (! is_string($url)) {
        $this->fail('Sharing did not provide a URL string.');
    }

    expect(parse_url($url, PHP_URL_PATH))->toBe('/en');
    $queryString = parse_url($url, PHP_URL_QUERY);
    if (! is_string($queryString)) {
        $this->fail('The shared URL has no valid query string.');
    }

    parse_str($queryString, $query);
    expect($query)->toHaveKey('payload')->not->toHaveKey('lang');

    $page->navigate('/en?'.http_build_query($query))
        ->assertValue('FFB volume', '1,234')
        ->assertValue('CSPO Price', '12.5')
        ->assertSee('Share the result')
        ->assertNoJavaScriptErrors();
});

it('keeps canonical URLs language-specific and explains the tool in the FAQ', function (): void {
    $page = visit('/en/faq');

    $origin = $page->script('location.origin');
    if (! is_string($origin)) {
        $this->fail('The browser did not provide an origin URL.');
    }

    $page->assertSee('What is the RSPO Credit Calculator?')
        ->assertScript('document.querySelector("link[rel=canonical]").href', $origin.'/en/faq')
        ->assertScript('document.querySelector(`meta[property="og:url"]`).content', $origin.'/en/faq')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', $origin.'/en/faq');

    $page->navigate('/id/faq')
        ->assertSee('Apa itu Kalkulator Kredit RSPO?')
        ->assertScript('document.querySelector("link[rel=canonical]").href', $origin.'/id/faq')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', $origin.'/id/faq');

    $page->navigate('/en')
        ->assertPresent('header img[src="/logo.svg"]')
        ->assertScript('document.querySelector("header [role=combobox]") !== null', true)
        ->assertScript('document.querySelector("footer [role=combobox]") === null', true)
        ->assertScript('[...document.querySelectorAll("footer button")].some((button) => button.innerText.includes("Dark mode"))', true)
        ->assertScript('document.body.innerText.includes("before costs and taxes")', false)
        ->assertScript('document.querySelector("link[rel=icon]").href.endsWith("/logo.svg")', true)
        ->assertNoJavaScriptErrors();

    $page->navigate('/id')
        ->assertScript('document.body.innerText.includes("sebelum biaya dan pajak")', false);

    $page->navigate('/en')
        ->click('header [role=combobox]')
        ->click('Indonesia')
        ->assertPathIs('/id')
        ->assertScript('document.documentElement.lang', 'id');
});

it('persists the selected color scheme across page loads', function (): void {
    Http::preventStrayRequests();
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);

    $page = visit('/en');
    $page->script('localStorage.removeItem("rspocc:color-scheme");');
    $page->script('document.cookie = "rspocc_color_scheme=; Max-Age=0; Path=/; SameSite=Lax";');
    $page->refresh()->click('Dark mode')
        ->assertScript('localStorage.getItem("rspocc:color-scheme")', 'dark')
        ->assertScript('document.cookie.includes("rspocc_color_scheme=dark")', true);

    $page->script('localStorage.removeItem("rspocc:color-scheme");');
    $page->refresh()
        ->assertScript('JSON.parse(document.querySelector(`script[data-page="app"]`).textContent).props.colorScheme', 'dark')
        ->assertScript('document.documentElement.classList.contains("dark")', true)
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'dark')
        ->assertSee('Light mode')
        ->click('Light mode');

    $page->script('localStorage.removeItem("rspocc:color-scheme");');
    $page->refresh()
        ->assertScript('JSON.parse(document.querySelector(`script[data-page="app"]`).textContent).props.colorScheme', 'light')
        ->assertScript('document.documentElement.classList.contains("dark")', false)
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'light')
        ->assertNoJavaScriptErrors();
});

it('sorts glossary titles alphabetically in each language', function (): void {
    foreach (['en', 'id'] as $language) {
        visit("/$language/glossary")
            ->assertScript('(() => { const titles = [...document.querySelectorAll("article section h2")].map((heading) => heading.textContent); return titles.length > 0 && titles.every((title, index) => index === 0 || titles[index - 1].localeCompare(title) <= 0); })()', true)
            ->assertNoJavaScriptErrors();
    }
});

it('renders shared image metadata directly in the document head', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);
    $payload = 'N4Igbg9gNgrgtgUxALgIwAZMBoQwHYCWALiiCThAgE4oBM6OA1tXQHS0CsOAngQlABM2Adi4gADlQIBjBAGcUoaXPEQUAZlYA2YTmXjGa5AA5jrYaj0rmKdK1QBfHAgAe0gBYBDPAHMkaY1paAE49GCoqBDxpblIASQARACUQHChvHxhPP1ICIQcgA';

    visit('/en?'.http_build_query(['payload' => $payload]))
        ->assertScript('document.querySelector(`head > meta[property="og:image"][data-inertia]`) !== null', true)
        ->assertScript('document.querySelector(`head > meta[name="twitter:card"][data-inertia]`).content', 'summary_large_image')
        ->assertNoJavaScriptErrors();
});

it('keeps nonzero decimals in added revenue per kilogram', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);
    $payload = 'N4Igbg9gNgrgtgUxALgIwAZMBoQwHYCWALiiCThAgE4oBM6OA1tXQHS0CsOAngQlABM2Adi4gADlQIBjBAGcUoaXPEQUAZlYA2YTmXjGa5AA5jrYaj0rmKdK1QBfHAgAe0gBYBDPAHMkaLUwGEGkYKioEPGluUgBJABEAJRAcKG8fGE8-UgIhByA';

    visit('/en?'.http_build_query(['payload' => $payload]))
        ->assertScript('Array.from(document.querySelectorAll("p")).some((node) => node.textContent.replace(/\s/g, "") === "IDR43.72/kg")', true)
        ->fill('CSPO Price', '0')
        ->fill('CSPKO Price', '0')
        ->fill('CSPKE Price', '0')
        ->assertScript('Array.from(document.querySelectorAll("p")).some((node) => node.textContent.replace(/\s/g, "") === "IDR0/kg")', true)
        ->assertNoJavaScriptErrors();
});

it('opens and focuses each matching extraction rate from product volumes', function (): void {
    visit('/en')
        ->fill('FFB volume', '1000')
        ->fill('CSPO Price', '10')
        ->assertScript('document.querySelector("#cspo-rate")?.closest("details")?.closest(".MuiPaper-root")?.querySelector("h2")?.textContent', 'Estimated product volumes')
        ->assertDontSee('View extraction rates')
        ->click('[aria-label="Edit CSPO rate: 20% of FFB"]')
        ->assertScript('document.querySelector("#cspo-rate")?.closest("details")?.closest(".MuiPaper-root")?.querySelector("h2")?.textContent', 'Estimated product volumes')
        ->assertScript('document.querySelector("details")?.open', true)
        ->assertScript('document.activeElement?.id', 'cspo-rate')
        ->click('[aria-label="Edit CSPKO rate: 2.25% of FFB"]')
        ->assertScript('document.activeElement?.id', 'cspko-rate')
        ->click('[aria-label="Edit CSPKE rate: 2.75% of FFB"]')
        ->assertScript('document.activeElement?.id', 'cspke-rate')
        ->assertNoJavaScriptErrors();
});

it('remembers a currency choice while preserving shared calculation rates', function (): void {
    Http::preventStrayRequests();
    CreditPriceSnapshot::factory()->create(['exchange_rates' => ['IDR' => ['rate' => 16000, 'date' => '2026-11-13'], 'SGD' => ['rate' => 1.35, 'date' => '2026-11-13']]]);
    $page = visit('/en')->fill('FFB volume', '1000')->fill('CSPO Price', '10');
    $page->click('[role="combobox"][aria-label="Currency"]')
        ->click('[role="option"][data-value="SGD"]')
        ->assertScript('document.querySelector("input[name=exchange]")?.value', '1.35')
        ->assertScript('localStorage.getItem("rspocc:currency")', 'SGD');

    $page->script('history.replaceState(null, "", location.href);');
    $page->refresh()
        ->fill('FFB volume', '1000')->fill('CSPO Price', '10')
        ->assertScript('document.querySelector("[role=combobox][aria-label=Currency]")?.textContent?.trim()', 'SGD')
        ->assertScript('document.querySelector("input[name=exchange]")?.value', '1.35');

    $payload = 'N4Igbg9gNgrgtgUxALgIwAZMBoQwHYCWALiiCThAgE4oBM6OA1tXQHS0CsOAngQlABM2Adi4gADlQIBjBAGcUoaXPEQUAZlYA2YTmXjGa5AA5jrYaj0rmKdK1QBfHAgAe0gBYBDPAHMkaLUwGEGkYKioEPGluUgBJABEAJRAcKG8fGE8-UgIhByA';
    $page->navigate('/en?'.http_build_query(['payload' => $payload]))
        ->assertScript('document.querySelector("input[name=exchange]")?.value', '16,000')
        ->assertScript('localStorage.getItem("rspocc:currency")', 'SGD')
        ->assertNoJavaScriptErrors();
});

it('preserves the IDR fallback when no reference rates are stored', function (): void {
    Http::preventStrayRequests();
    $page = visit('/en');
    $page->script('localStorage.setItem("rspocc:currency", "IDR"); history.replaceState(null, "", location.href);');
    $page->refresh()
        ->fill('FFB volume', '1000')->fill('CSPO Price', '10')
        ->assertScript('document.querySelector("input[name=exchange]")?.value', '16,000')
        ->assertSee('Share the result')
        ->assertNoJavaScriptErrors();
    Http::assertNothingSent();
});

it('switches result currency and keeps settings synchronized', function (): void {
    CreditPriceSnapshot::factory()->create(['exchange_rates' => [
        'IDR' => ['rate' => 16000, 'date' => '2026-11-13'],
        'SGD' => ['rate' => 1.35, 'date' => '2026-11-13'],
    ]]);
    $page = visit('/en');
    $page->fill('FFB volume', '1000')->fill('CSPO Price', '10')
        ->click('[role="combobox"][aria-label="Currency"]')->click('[role="option"][data-value="SGD"]')
        ->assertScript('localStorage.getItem("rspocc:currency")', 'SGD')
        ->assertScript('Array.from(document.querySelectorAll("p")).some(node => node.textContent.replace(/\s/g, "") === "SGD2,700")', true)
        ->assertScript('document.querySelector("input[name=exchange]")?.value', '1.35')
        ->click('[role="combobox"][aria-label="Currency"]')->click('[role="option"][data-value="EUR"]')
        ->assertSee('Estimated credit revenue')
        ->assertSee('Enter an exchange rate in Settings to see your estimate.')
        ->assertDontSee('Share the result')
        ->click('[role="combobox"][aria-label="Currency"]')->click('[role="option"][data-value="USD"]')
        ->assertSee('No exchange rate is needed for USD.')
        ->assertScript('document.querySelector(`input[aria-label="Rate per USD"]`) === null', true)
        ->assertNoJavaScriptErrors();
});
