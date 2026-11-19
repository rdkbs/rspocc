<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CreditPriceSnapshot;
use App\Models\ExchangeRateSnapshot;
use App\Services\CalculatorPreview;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CalculatorController extends Controller
{
    public function index(Request $request, CalculatorPreview $preview): Response
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

        $rateSnapshot = ExchangeRateSnapshot::query()->latest('snapshot_date')->first();
        $exchangeRates = $rateSnapshot === null ? [] : $rateSnapshot->rates;

        $sharePreview = $payload === null ? null : $preview->metadata($payload, app()->getLocale());
        if ($sharePreview !== null) {
            $sharePreview['imageUrl'] = function_exists('imagecreatetruecolor') && function_exists('imagettftext')
                ? rtrim(config()->string('app.url'), '/').route('calculator.preview-image', ['language' => app()->getLocale(), 'payload' => $payload], absolute: false)
                : null;
        }

        return Inertia::render('index', [
            'payload' => $payload,
            'exchangeRates' => $exchangeRates,
            'sharePreview' => $sharePreview,
            'previewImageUrl' => function_exists('imagecreatetruecolor') && function_exists('imagettftext')
                ? ($sharePreview['imageUrl'] ?? rtrim(config()->string('app.url'), '/').route('calculator.preview-image', ['language' => app()->getLocale()], absolute: false))
                : null,
            'priceReference' => $priceReference,
        ]);
    }
}
