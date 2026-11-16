<?php

declare(strict_types=1);

use Inertia\Testing\AssertableInertia as Assert;

it('redirects unprefixed content to Indonesian pages', function (string $slug): void {
    $this->get("/$slug")->assertRedirect("/id/$slug");
    $this->get("/en/$slug")->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('content')->where('slug', $slug));
})->with(['guide', 'faq', 'about', 'terms', 'privacy', 'glossary']);

it('passes calculator payloads without storing a scenario', function (): void {
    $this->get('/en?payload=scenario')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', 'scenario'));
    $this->get('/id')->assertOk()->assertInertia(fn (Assert $page): Assert => $page->component('index')->where('payload', null));
});

it('renders the selected language in Inertia props and the document', function (string $url, string $language): void {
    $response = $this->get($url);

    $response->assertOk();
    $response->assertInertia(fn (Assert $page): Assert => $page->where('lang', $language));
    $response->assertSeeHtml('lang="'.$language.'"');
})->with([
    'Indonesian calculator default' => ['/id', 'id'],
    'English calculator link' => ['/en', 'en'],
    'Indonesian guide' => ['/id/guide', 'id'],
    'English guide' => ['/en/guide', 'en'],
]);

it('rejects excessively long and multi segment payloads', function (): void {
    $this->get('/en?payload='.\str_repeat('a', 4097))->assertStatus(414);
    $this->get('/en?payload[]=bad')->assertBadRequest();
    $this->get('/scenario')->assertNotFound();
    $this->get('/a/b')->assertNotFound();
});

it('redirects the root while preserving a shared payload', function (): void {
    $this->get('/?payload=scenario')->assertRedirect('/id?payload=scenario');
});
