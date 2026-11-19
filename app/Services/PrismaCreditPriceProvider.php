<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use UnexpectedValueException;

final class PrismaCreditPriceProvider
{
    /** @return array<string, array<string, int|float>> */
    public function fetchPrices(CarbonInterface $start, CarbonInterface $end): array
    {
        $prices = [];
        $isFirstRequest = true;

        foreach (['standard' => '', 'is' => 'IS_'] as $kind => $prefix) {
            foreach (['cspo', 'cspko', 'cspke'] as $credit) {
                if (! $isFirstRequest) {
                    Sleep::for(3)->seconds();
                }
                $isFirstRequest = false;

                $data = Http::acceptJson()->connectTimeout(5)->timeout(20)->retry(2, 500)
                    ->get('https://api-platform.trade-and-traceability.prismabyrspo.org/public/v1/credit-trading/price-data', [
                        'creditType' => $prefix.strtoupper($credit),
                        'startDate' => $start->toISOString(),
                        'endDate' => $end->toISOString(),
                    ])->throw()->json();

                if (! \is_array($data) || ! is_numeric($data['quantity'] ?? null) || $data['quantity'] < 0) {
                    throw new UnexpectedValueException('Missing or invalid traded price for '.$prefix.strtoupper($credit));
                }

                if ((float) $data['quantity'] === 0.0) {
                    continue;
                }

                $price = $data['lastTradedPrice'] ?? null;
                if ((! \is_int($price) && ! \is_float($price)) || ! is_finite($price) || $price < 0) {
                    throw new UnexpectedValueException('Missing or invalid traded price for '.$prefix.strtoupper($credit));
                }
                $prices[$kind][$credit] = $price;
            }
        }

        return $prices;
    }
}
