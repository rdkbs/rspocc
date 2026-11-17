<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;

it('redirects unprefixed content to Indonesian pages', function (string $slug): void {
    $this->get("/$slug")->assertRedirect("/id/$slug");
    $this->get("/en/$slug")->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('content')->where('slug', $slug));
})->with(['faq', 'terms', 'privacy', 'glossary']);

it('passes calculator payloads without storing a scenario', function (): void {
    $this->get('/en?payload=scenario')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', 'scenario'));
    $this->get('/id')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', null)->where('priceReference.prices.is.cspo', 3.67));
});

it('renders the selected language in Inertia props and the document', function (string $url, string $language): void {
    $response = $this->get($url);

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page->where('lang', $language));
    $response->assertSeeHtml('lang="'.$language.'"');
})->with([
    'Indonesian calculator default' => ['/id', 'id'],
    'English calculator link' => ['/en', 'en'],
    'Indonesian FAQ' => ['/id/faq', 'id'],
    'English FAQ' => ['/en/faq', 'en'],
]);

it('keeps the localized text fallback inside noscript', function (string $url, string $language, string $title): void {
    $response = $this->get($url);

    $response->assertOk();
    $response->assertSeeHtml('<title>'.$title.' - RSPO Credit Calculator</title>');
    $response->assertSeeHtml('<div id="initial-page-fallback" lang="'.$language.'">');
    expect($response->getContent())->toMatch(
        '/<noscript>\s*<div id="initial-page-fallback" lang="'.$language.'">/',
    );
    $response->assertSeeHtml('#app:not(:empty) + #app-loading { display: none; }');
    $response->assertSeeHtml("document.documentElement.classList.add('js');");
    $response->assertSeeHtml('<img src="/logo.svg" alt="" width="44" height="44">');
})->with([
    'Indonesian calculator' => ['/id', 'id', 'Perkirakan pendapatan kredit RSPO'],
    'English calculator' => ['/en', 'en', 'Estimate RSPO credit revenue'],
]);

it('renders the saved color scheme in the initial HTML', function (): void {
    $response = $this->withUnencryptedCookie('rspocc_color_scheme', 'dark')->get('/en');

    $response->assertOk()
        ->assertSeeHtml('<html data-type="software" lang="en" class="dark">')
        ->assertSeeHtml('<meta name="color-scheme" content="dark">')
        ->assertInertia(fn (Assert $page): Assert => $page->where('colorScheme', 'dark'));
});

it('rejects excessively long and multi segment payloads', function (): void {
    $this->get('/en?payload='.\str_repeat('a', 4097))->assertStatus(414);
    $this->get('/en?payload[]=bad')->assertBadRequest();
    $this->get('/scenario')->assertNotFound();
    $this->get('/a/b')->assertNotFound();
});

it('redirects the root while preserving a shared payload', function (): void {
    $this->withHeader('Accept-Language', 'id-ID')->get('/?payload=scenario')->assertRedirect('/id?payload=scenario');
});

it('detects a language only at the unprefixed homepage', function (string $languages, string $expected): void {
    $response = $this->withHeader('Accept-Language', $languages)->get('/?payload=scenario');
    $response->assertFound()->assertRedirect('/'.$expected.'?payload=scenario');
    expect($response->headers->get('Vary'))->toContain('Accept-Language')->toContain('Cookie');
    $this->get('/en')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('lang', 'en'));
    $this->get('/id')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->where('lang', 'id'));
})->with([
    ['en-US,en;q=0.9,id;q=0.8', 'id'],
    ['en-US,en;q=0.9,id;q=0', 'en'],
    ['en-US,id-ID;q=0', 'en'],
    ['en-SG,en;q=0.9', 'en'],
    ['id-ID,id;q=0.9', 'id'],
    ['zh-CN', 'id'],
    ['', 'id'],
]);

it('prefers a saved language over browser preferences', function (): void {
    $this->withUnencryptedCookie('rspocc_language', 'en')
        ->withHeader('Accept-Language', 'id-ID')->get('/')->assertRedirect('/en');
});

it('ignores unsupported saved languages', function (): void {
    $this->withUnencryptedCookie('rspocc_language', 'invalid')
        ->withHeader('Accept-Language', 'en-US')->get('/')->assertRedirect('/en');
});
