<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

it('restores an edited FFB volume from its scenario URL', function (): void {
    config(['cache.stores.file' => ['driver' => 'array']]);
    Cache::purge('file');
    Http::fake([
        'api.frankfurter.dev/*' => Http::response([
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'IDR', 'rate' => 16000],
            ['date' => '2026-11-13', 'base' => 'USD', 'quote' => 'MYR', 'rate' => 4.5],
        ]),
    ]);

    $page = visit('/?lang=en');

    $page->click('Rates')->assertSee('Rate date: Nov 13, 2026');

    $page->fill('FFB volume', '1234')
        ->assertValue('FFB volume', '1,234')
        ->assertQueryStringHas('lang', 'en')
        ->assertScript('location.pathname !== "/"', true);

    $scenarioUrl = $page->url();

    $page->navigate($scenarioUrl)->assertValue('FFB volume', '1,234');
    $page->assertNoJavaScriptErrors();
});

it('keeps canonical URLs language-specific and displays the cooperative mission', function (): void {
    $page = visit('/about?lang=en');

    $page->assertSee('Our mission')
        ->assertScript('document.querySelector("link[rel=canonical]").href', 'https://rspocc.belayansejahtera.org/about?lang=en')
        ->assertScript('document.querySelector(`meta[property="og:url"]`).content', 'https://rspocc.belayansejahtera.org/about?lang=en')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', 'https://rspocc.belayansejahtera.org/about?lang=en');

    $page->navigate('/about?lang=id')
        ->assertSee('Misi')
        ->assertScript('document.querySelector("link[rel=canonical]").href', 'https://rspocc.belayansejahtera.org/about')
        ->assertScript('JSON.parse(document.querySelector(`script[type="application/ld+json"]`).textContent).url', 'https://rspocc.belayansejahtera.org/about');

    $page->navigate('/?lang=en')
        ->assertPresent('header img[src="/kbs-wordmark.png"]')
        ->assertScript('document.body.innerText.includes("before costs and taxes")', false)
        ->assertScript('document.querySelector("link[rel=icon]").href.endsWith("/favicon.ico")', true)
        ->assertNoJavaScriptErrors();

    $page->navigate('/?lang=id')
        ->assertScript('document.body.innerText.includes("sebelum biaya dan pajak")', false);

    $page->navigate('/?lang=en')
        ->click('Dark mode')
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'dark')
        ->click('Light mode')
        ->assertScript('getComputedStyle(document.documentElement).colorScheme', 'light');
});
