<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CreditPriceSnapshot;
use App\Services\FrankfurterExchangeRateProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class ExchangeRateController extends Controller
{
    public function __invoke(FrankfurterExchangeRateProvider $exchangeRateProvider): JsonResponse
    {
        $cache = Cache::store('file');
        $cached = $cache->get('exchange-rates:fresh');
        if ($cached !== null) {
            return response()->json($cached);
        }

        $rates = $exchangeRateProvider->fetchUsdRates();
        if ($rates !== null) {
            $result = ['rates' => $rates, 'fetchedAt' => now()->toIso8601String(), 'stale' => false];
            $cache->forever('exchange-rates:last-success', $result);
            $cache->put('exchange-rates:fresh', $result, 3600);
        } else {
            $previous = $cache->get('exchange-rates:last-success');
            if (! \is_array($previous)) {
                $snapshot = CreditPriceSnapshot::query()
                    ->whereNotNull('exchange_rates')
                    ->orderByDesc('period_end')
                    ->first();

                if ($snapshot !== null && $snapshot->exchange_rates !== null) {
                    $previous = [
                        'rates' => $snapshot->exchange_rates,
                        'fetchedAt' => $snapshot->retrieved_at->toIso8601String(),
                    ];
                }
            }
            $result = \is_array($previous) ? $previous : ['rates' => [], 'fetchedAt' => null];
            $result['stale'] = true;
            $cache->put('exchange-rates:fresh', $result, 60);
        }

        return response()->json($result);
    }
}
