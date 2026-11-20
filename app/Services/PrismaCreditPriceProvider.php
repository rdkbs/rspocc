<?php

declare(strict_types=1);

namespace App\Services;

use Carbon\CarbonInterface;
use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use UnexpectedValueException;

final class PrismaCreditPriceProvider
{
    private const int REQUEST_COOLDOWN_SECONDS = 3;

    /** @return array<string, array<string, int|float>> */
    public function fetchPrices(CarbonInterface $start, CarbonInterface $end): array
    {
        $prices = [];

        foreach (['standard' => '', 'is' => 'IS_'] as $kind => $prefix) {
            foreach (['cspo', 'cspko', 'cspke'] as $credit) {
                $data = $this->fetchRange($prefix.strtoupper($credit), $start, $end)->throw()->json();

                if (! \is_array($data) || ! is_numeric($data['quantity'] ?? null) || $data['quantity'] < 0) {
                    throw new UnexpectedValueException("Missing or invalid traded price for $prefix".strtoupper($credit));
                }

                if ((float) $data['quantity'] === 0.0) {
                    continue;
                }

                $price = $data['lastTradedPrice'] ?? null;
                if ((! \is_int($price) && ! \is_float($price)) || ! is_finite($price) || $price < 0) {
                    throw new UnexpectedValueException("Missing or invalid traded price for $prefix".strtoupper($credit));
                }
                $prices[$kind][$credit] = $price;
            }
        }

        return $prices;
    }

    public function fetchRange(string $creditType, CarbonInterface $start, CarbonInterface $end): Response
    {
        $parameters = [
            'creditType' => $creditType,
            'startDate' => DateTimeImmutable::createFromInterface($start)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z'),
            'endDate' => DateTimeImmutable::createFromInterface($end)->setTimezone(new DateTimeZone('UTC'))->format('Y-m-d\TH:i:s.v\Z'),
        ];

        $lock = Cache::lock('prisma:request-slot', 50);
        $lock->block(45);

        try {
            if (Cache::has('prisma:request-cooldown')) {
                Sleep::for(self::REQUEST_COOLDOWN_SECONDS)->seconds();
            }

            try {
                return Http::acceptJson()->connectTimeout(5)->timeout(20)->retry(2, throw: false)
                    ->get('https://api-platform.trade-and-traceability.prismabyrspo.org/public/v1/credit-trading/price-data', $parameters);
            } finally {
                Cache::put('prisma:request-cooldown', true, self::REQUEST_COOLDOWN_SECONDS);
            }
        } finally {
            $lock->release();
        }
    }
}
