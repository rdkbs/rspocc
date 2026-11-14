<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use DateTimeImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use UnexpectedValueException;

class ExchangeRateController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $cache = Cache::store('file');
        $cached = $cache->get('exchange-rates:fresh');
        if ($cached !== null) {
            return response()->json($cached);
        }

        try {
            $rows = Http::acceptJson()->connectTimeout(2)->timeout(5)
                ->get('https://api.frankfurter.dev/v2/rates', ['base' => 'USD', 'quotes' => 'IDR,MYR'])
                ->throw()->json();
            if (! \is_array($rows) || \count($rows) !== 2) {
                throw new UnexpectedValueException('Incomplete exchange rates.');
            }

            $rates = [];
            foreach ($rows as $row) {
                if (! \is_array($row) || ($row['base'] ?? null) !== 'USD'
                    || ! \in_array($row['quote'] ?? null, ['IDR', 'MYR'], true)
                    || (! \is_int($row['rate'] ?? null) && ! is_float($row['rate'] ?? null))
                    || ! \is_finite($row['rate']) || $row['rate'] <= 0 || $row['rate'] > 1e12
                    || ! \is_string($row['date'] ?? null)
                    || preg_match('/^\d{4}-\d{2}-\d{2}$/', $row['date']) !== 1
                    || ($date = DateTimeImmutable::createFromFormat('!Y-m-d', $row['date'])) === false
                    || $date->format('Y-m-d') !== $row['date']) {
                    throw new UnexpectedValueException('Invalid exchange rate.');
                }
                $rates[$row['quote']] = ['rate' => $row['rate'], 'date' => $row['date']];
            }
            if (! isset($rates['IDR'], $rates['MYR'])) {
                throw new UnexpectedValueException('Missing exchange rate.');
            }

            $result = ['rates' => $rates, 'fetchedAt' => now()->toIso8601String(), 'stale' => false];
            $cache->forever('exchange-rates:last-success', $result);
            $cache->put('exchange-rates:fresh', $result, 3600);
        } catch (ConnectionException|RequestException|UnexpectedValueException) {
            $previous = $cache->get('exchange-rates:last-success');
            $result = \is_array($previous) ? $previous : ['rates' => [], 'fetchedAt' => null];
            $result['stale'] = true;
            $cache->put('exchange-rates:fresh', $result, 60);
        }

        return response()->json($result);
    }
}
