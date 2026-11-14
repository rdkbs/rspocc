<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;

it('keeps content routes ahead of calculator payloads', function (string $slug): void {
    $this->get("/$slug")->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('content')->where('slug', $slug));
})->with(['guide', 'faq', 'about', 'terms', 'privacy', 'glossary']);

it('passes calculator payloads without storing a scenario', function (): void {
    $this->get('/scenario')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', 'scenario'));
    $this->get('/')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', null));
});

it('renders the selected language in Inertia props and the document', function (string $url, string $language): void {
    $response = $this->get($url);

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page->where('lang', $language));
    $response->assertSeeHtml('lang="'.$language.'"');
})->with([
    'Indonesian calculator default' => ['/', 'id'],
    'English calculator link' => ['/?lang=en', 'en'],
    'Indonesian guide' => ['/guide?lang=id', 'id'],
    'English guide' => ['/guide?lang=en', 'en'],
]);

it('rejects excessively long and multi segment payloads', function (): void {
    $this->get('/'.\str_repeat('a', 4097))->assertStatus(414);
    $this->get('/a/b')->assertNotFound();
});
