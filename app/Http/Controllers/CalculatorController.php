<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CalculatorController extends Controller
{
    public function index(?string $payload = null): Response
    {
        abort_if($payload !== null && \strlen($payload) > 4096, 414);

        return Inertia::render('index', ['payload' => $payload]);
    }
}
