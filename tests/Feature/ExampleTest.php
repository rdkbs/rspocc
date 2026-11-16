<?php

declare(strict_types=1);

test('redirects the homepage to the Indonesian calculator', function (): void {
    $this->get('/')->assertMovedPermanently()->assertRedirect('/id');

    $this->get('/id')->assertOk();
});
