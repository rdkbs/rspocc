<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CalculatorController extends Controller
{
    public function index(Request $request): Response
    {
        $payload = $request->query('payload');

        abort_if($payload !== null && ! \is_string($payload), 400);

        abort_if($payload !== null && \strlen($payload) > 4096, 414);

        return Inertia::render('index', [
            'payload' => $payload,
        ]);
    }
}
