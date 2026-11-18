<?php

declare(strict_types=1);

use App\Services\CalculatorPreview;

/** @return list<array{payload: string, result: array{kg: int|float, usd: int|float, converted: int|float, added: int|float, currency: string}}> */
function previewFixtures(): array
{
    $json = file_get_contents(__DIR__.'/../Fixtures/calculator-previews.json');
    if ($json === false) {
        throw new RuntimeException('Missing preview fixtures.');
    }
    $fixtures = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
    if (! is_array($fixtures) || ! array_is_list($fixtures)) {
        throw new RuntimeException('Invalid preview fixtures.');
    }
    $validated = [];
    foreach ($fixtures as $fixture) {
        if (! is_array($fixture) || ! is_string($fixture['payload'] ?? null) || ! is_array($fixture['result'] ?? null)) {
            throw new RuntimeException('Invalid fixture.');
        }
        $result = ['kg' => 0, 'usd' => 0, 'converted' => 0, 'added' => 0];
        foreach (['kg', 'usd', 'converted', 'added'] as $key) {
            $value = $fixture['result'][$key] ?? null;
            if (! is_int($value) && ! is_float($value)) {
                throw new RuntimeException('Invalid fixture amount.');
            }
            $result[$key] = $value;
        }
        $currency = $fixture['result']['currency'] ?? null;
        if (! is_string($currency)) {
            throw new RuntimeException('Invalid fixture currency.');
        }
        $validated[] = ['payload' => $fixture['payload'], 'result' => [...$result, 'currency' => $currency]];
    }

    return $validated;
}

it('matches JavaScript calculations including legacy shared links', function (): void {
    $fixtures = previewFixtures();
    foreach ($fixtures as $fixture) {
        $result = resolve(CalculatorPreview::class)->calculate($fixture['payload']);
        if ($result === null) {
            $this->fail('A valid preview must calculate.');
        }
        foreach (['kg', 'usd', 'converted', 'added'] as $key) {
            expect($result[$key])->toEqualWithDelta($fixture['result'][$key], 0.000001);
        }
        expect($result['currency'])->toBe($fixture['result']['currency']);
    }
});

it('renders calculation previews without JavaScript while keeping canonical URLs clean', function (string $language, string $title, string $description): void {
    $fixtures = previewFixtures();
    $payload = $fixtures[0]['payload'];
    $response = $this->get('/'.$language.'?'.http_build_query(['payload' => $payload]));
    $response->assertOk()
        ->assertSeeHtml('<meta property="og:title" content="'.$title.'">')
        ->assertSeeHtml('<meta property="og:description" content="'.$description.'">')
        ->assertSeeHtml('<link rel="canonical" href="'.config()->string('app.url').'/'.$language.'">')
        ->assertSeeHtml('<meta property="og:url" content="'.config()->string('app.url').'/'.$language.'?'.http_build_query(['payload' => $payload], '', '&', PHP_QUERY_RFC3986).'">')
        ->assertSeeHtml('<meta name="twitter:title" content="'.$title.'">');
})->with([
    ['en', 'Estimated RSPO credit revenue: IDR 43,723,600', 'FFB volume: 1,000 t. Premium revenue: IDR 43,723,600. Added value: IDR 43.72/kg FFB. Results are estimates.'],
    ['id', 'Perkiraan pendapatan kredit RSPO: IDR 43.723.600', 'Volume TBS: 1.000 t. Pendapatan premi: IDR 43.723.600. Nilai tambah: IDR 43,72/kg TBS. Hasil ini hanya perkiraan.'],
]);

it('falls back to generic metadata for invalid or oversized decoded scenarios', function (string $payload): void {
    $this->get('/en?'.http_build_query(['payload' => $payload]))->assertOk()
        ->assertSeeHtml('<meta property="og:title" content="Estimate RSPO credit revenue">');
})->with(['bad link', 'N4Ig', '!!!!', '']);

it('rejects invalid and decompression bomb payloads without calculating a preview', function (): void {
    $json = file_get_contents(__DIR__.'/../Fixtures/invalid-preview-payloads.json');
    if ($json === false) {
        $this->fail('Missing invalid payload fixtures.');
    }
    $payloads = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
    if (! is_array($payloads)) {
        $this->fail('Invalid payload fixtures.');
    }
    foreach ($payloads as $payload) {
        if (! is_string($payload)) {
            $this->fail('A payload must be a string.');
        }
        expect(resolve(CalculatorPreview::class)->calculate($payload))->toBeNull();
    }
});

it('renders a shareable PNG result card', function (): void {
    $payload = previewFixtures()[0]['payload'];
    $response = $this->get('/en/share-preview.png?'.http_build_query(['payload' => $payload]));
    $response->assertOk()->assertHeader('Content-Type', 'image/png');
    $png = $response->getContent();
    if (! is_string($png)) {
        $this->fail('The preview must contain image bytes.');
    }
    $size = getimagesizefromstring($png);
    expect($size)->not->toBeFalse();
    if ($size !== false) {
        expect($size)->toMatchArray([0 => 1200, 1 => 630]);
    }
    $this->get('/en?'.http_build_query(['payload' => $payload]))->assertOk()
        ->assertSeeHtml('<meta property="og:image:width" content="1200">')
        ->assertSeeHtml('<meta name="twitter:card" content="summary_large_image">');
});

it('rejects invalid image requests', function (): void {
    $this->get('/en/share-preview.png')->assertOk()->assertHeader('Content-Type', 'image/png');
    $this->get('/en/share-preview.png?payload[]=bad')->assertBadRequest();
    $this->get('/en/share-preview.png?payload=bad')->assertNotFound();
    $this->get('/en/share-preview.png?payload='.str_repeat('a', 4097))->assertStatus(414);
    $this->get('/xx/share-preview.png')->assertNotFound();
});

it('includes a generic preview image on the index without a payload', function (string $language): void {
    $this->get('/'.$language)->assertOk()
        ->assertSeeHtml('<meta property="og:image" content="'.config()->string('app.url').'/'.$language.'/share-preview.png">')
        ->assertSeeHtml('<meta name="twitter:card" content="summary_large_image">');
})->with(['id', 'en']);

it('omits zero decimals but preserves fractional preview amounts', function (float $value, string $language, string $expected): void {
    expect(resolve(CalculatorPreview::class)->formatNumber($value, $language))->toBe($expected);
})->with([
    [1000.0, 'en', '1,000'],
    [1000.0, 'id', '1.000'],
    [43.7236, 'en', '43.72'],
    [43.7236, 'id', '43,72'],
    [0.0042, 'en', '0.0042'],
    [0.0042, 'id', '0,0042'],
    [0.0001, 'en', '0.0001'],
    [0.00009, 'en', '<0.0001'],
    [0.00009, 'id', '<0,0001'],
    [43.5, 'en', '43.5'],
    [0.0, 'id', '0'],
    [1000.001, 'en', '1,000'],
    [1000000.5, 'en', '1,000,001'],
    [1000000.0, 'id', '1.000.000'],
    [999999.0, 'en', '999,999'],
    [999999.5, 'id', '1.000.000'],
]);
