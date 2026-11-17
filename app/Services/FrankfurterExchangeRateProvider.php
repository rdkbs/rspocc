<?php

declare(strict_types=1);

namespace App\Services;

use DateTimeImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use UnexpectedValueException;

final class FrankfurterExchangeRateProvider
{
    /** @var list<string> */
    private const array CURRENCIES = ['IDR', 'MYR', 'CNY', 'EUR', 'SGD'];

    /**
     * @return array{IDR: array{rate: int|float, date: string}, MYR: array{rate: int|float, date: string}, CNY: array{rate: int|float, date: string}, EUR: array{rate: int|float, date: string}, SGD: array{rate: int|float, date: string}}|null
     */
    public function fetchUsdRates(): ?array
    {
        try {
            $rows = Http::acceptJson()->connectTimeout(2)->timeout(5)
                ->get('https://api.frankfurter.dev/v2/rates', [
                    'base' => 'USD',
                    'quotes' => implode(',', self::CURRENCIES),
                ])
                ->throw()->json();

            if (! \is_array($rows) || \count($rows) !== \count(self::CURRENCIES)) {
                throw new UnexpectedValueException('Incomplete exchange rates.');
            }

            $rates = [];
            foreach ($rows as $row) {
                if (! \is_array($row) || ($row['base'] ?? null) !== 'USD'
                    || ! \in_array($row['quote'] ?? null, self::CURRENCIES, true)
                    || (! \is_int($row['rate'] ?? null) && ! \is_float($row['rate'] ?? null))
                    || ! \is_finite($row['rate']) || $row['rate'] <= 0 || $row['rate'] > 1e12
                    || ! \is_string($row['date'] ?? null)
                    || preg_match('/^\d{4}-\d{2}-\d{2}$/', $row['date']) !== 1
                    || ($date = DateTimeImmutable::createFromFormat('!Y-m-d', $row['date'])) === false
                    || $date->format('Y-m-d') !== $row['date']) {
                    throw new UnexpectedValueException('Invalid exchange rate.');
                }

                $rates[$row['quote']] = ['rate' => $row['rate'], 'date' => $row['date']];
            }

            if (! isset($rates['IDR'], $rates['MYR'], $rates['CNY'], $rates['EUR'], $rates['SGD'])) {
                throw new UnexpectedValueException('Missing exchange rate.');
            }

            return $rates;
        } catch (ConnectionException|RequestException|UnexpectedValueException) {
            return null;
        }
    }
}
