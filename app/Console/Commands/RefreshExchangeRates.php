<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\ExchangeRateSnapshot;
use App\Services\FrankfurterExchangeRateProvider;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('exchange-rates:refresh')]
#[Description('Retrieve the latest Frankfurter exchange rates')]
final class RefreshExchangeRates extends Command
{
    public function handle(FrankfurterExchangeRateProvider $exchangeRateProvider): int
    {
        $exchangeRates = $exchangeRateProvider->fetchUsdRates();

        if ($exchangeRates === null) {
            $this->warn('Frankfurter rates are unavailable; existing rates were kept.');

            return self::FAILURE;
        }

        ExchangeRateSnapshot::query()->updateOrCreate(
            ['snapshot_date' => today('UTC')->toDateString()],
            ['rates' => $exchangeRates, 'retrieved_at' => now('UTC')],
        );

        $this->info('Frankfurter exchange rates updated.');

        return self::SUCCESS;
    }
}
