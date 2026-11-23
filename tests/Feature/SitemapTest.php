<?php

declare(strict_types=1);

test('lists canonical public pages with their language alternates', function (): void {
    config(['app.url' => 'https://calculator.example.test/']);

    $response = $this->get('/sitemap.xml?payload=example')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
        ->assertDontSee('payload=');

    $xml = new DOMDocument;
    expect($xml->loadXML((string) $response->getContent()))->toBeTrue();

    $xpath = new DOMXPath($xml);
    $xpath->registerNamespace('s', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    $xpath->registerNamespace('xhtml', 'http://www.w3.org/1999/xhtml');

    expect($xpath->evaluate('count(/s:urlset/s:url)'))->toBe(8.0);

    foreach (['', '/trends', '/faq', '/glossary'] as $path) {
        foreach (['id', 'en'] as $language) {
            $url = "https://calculator.example.test/{$language}{$path}";
            $entry = "/s:urlset/s:url[s:loc='{$url}']";
            expect($xpath->evaluate("count({$entry})"))->toBe(1.0);

            foreach (['id', 'en'] as $alternate) {
                expect($xpath->evaluate("string({$entry}/xhtml:link[@rel='alternate'][@hreflang='{$alternate}']/@href)"))
                    ->toBe("https://calculator.example.test/{$alternate}{$path}");
            }
        }
    }
});
