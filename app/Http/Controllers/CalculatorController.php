<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CreditPriceSnapshot;
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

        $snapshot = CreditPriceSnapshot::query()->orderByDesc('period_end')->first();
        $priceReference = $snapshot === null ? [
            'source' => 'PRISMA',
            'checkedOn' => CreditPriceSnapshot::BASELINE_CHECKED_ON,
            'periodStart' => '2026-01-01',
            'periodEnd' => '2026-11-15',
            'prices' => CreditPriceSnapshot::BASELINE_PRICES,
        ] : [
            'source' => 'PRISMA',
            'checkedOn' => $snapshot->retrieved_at->toISOString(),
            'periodStart' => $snapshot->period_start,
            'periodEnd' => $snapshot->period_end,
            'prices' => $snapshot->prices,
        ];

        return Inertia::render('index', [
            'payload' => $payload,
            'priceReference' => $priceReference,
        ]);
    }
}
