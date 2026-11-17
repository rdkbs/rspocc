<?php

declare(strict_types=1);

test('redirects the homepage to the Indonesian calculator', function (): void {
    $this->withHeader('Accept-Language', 'id-ID')->get('/')->assertFound()->assertRedirect('/id');

    $this->get('/id')->assertOk();
});
