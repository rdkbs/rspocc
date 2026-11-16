<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('keeps edits off the URL and preserves inputs when switching language', function (): void {
    config(['cache.stores.file' => ['driver' => 'array']]);
    Cache::purge('file');
    Http::fake([
        'api.frankfurter.dev/*' => Http::response([
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'CNY', 'rate' => 7.2],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'EUR', 'rate' => 0.92],
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
    $page->assertNoJavaScriptErrors();
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
