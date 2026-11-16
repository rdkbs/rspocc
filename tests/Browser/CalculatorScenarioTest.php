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

it('restores calculator edits after returning from the guide', function (): void {
    Http::fake(['api.frankfurter.dev/*' => Http::response([])]);
    $page = visit('/en');
    $page->fill('FFB volume', '1234')->fill('CSPO Price', '12.5')
        ->click('header a[href="/en/guide"]')
        ->assertPathIs('/en/guide')
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

it('keeps canonical URLs language-specific and displays the cooperative mission', function (): void {
    $page = visit('/en/about');

    $page->assertSee('Belayan Sejahtera’s mission')
        ->assertScript('document.querySelector("link[rel=canonical]").href', 'https://rspocc.belayansejahtera.org/en/about')
        ->assertScript('document.querySelector(`meta[property="og:url"]`).content', 'https://rspocc.belayansejahtera.org/en/about')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', 'https://rspocc.belayansejahtera.org/en/about');

    $page->navigate('/id/about')
        ->assertSee('Misi')
        ->assertScript('document.querySelector("link[rel=canonical]").href', 'https://rspocc.belayansejahtera.org/id/about')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', 'https://rspocc.belayansejahtera.org/id/about');

    $page->navigate('/en')
        ->assertPresent('header img[src="/logo-white-green.svg"]')
        ->assertScript('document.querySelector("header [role=combobox]") !== null', true)
        ->assertScript('document.querySelector("footer [role=combobox]") === null', true)
        ->assertScript('[...document.querySelectorAll("footer button")].some((button) => button.innerText.includes("Dark mode"))', true)
        ->assertScript('document.body.innerText.includes("before costs and taxes")', false)
        ->assertScript('document.querySelector("link[rel=icon]").href.endsWith("/logo-white-green.svg")', true)
        ->assertNoJavaScriptErrors();

    $page->navigate('/id')
        ->assertScript('document.body.innerText.includes("sebelum biaya dan pajak")', false);

    $page->navigate('/en')
        ->click('header [role=combobox]')
        ->click('Indonesia')
        ->assertPathIs('/id')
        ->assertScript('document.documentElement.lang', 'id');

    $page->navigate('/en')
        ->click('Dark mode')
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'dark')
        ->click('Light mode')
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'light');
});
