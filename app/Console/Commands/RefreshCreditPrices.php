<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\CreditPriceSnapshot;
use App\Services\PrismaCreditPriceProvider;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use UnexpectedValueException;

#[Description('Retrieve PRISMA year-to-date last-traded credit prices')]
#[Signature('credits:refresh-prices')]
final class RefreshCreditPrices extends Command
{
    public function handle(PrismaCreditPriceProvider $priceProvider): int
    {
        $end = today('UTC')->subDay()->endOfDay();
        $start = $end->copy()->startOfYear();
        $previous = CreditPriceSnapshot::query()->orderByDesc('period_end')->first();
        $previousPrices = $previous === null ? [] : $previous->prices;
        $prices = array_replace_recursive($previousPrices, $priceProvider->fetchPrices($start, $end));

        if ($previous === null) {
            foreach (['standard', 'is'] as $kind) {
                foreach (['cspo', 'cspko', 'cspke'] as $credit) {
                    $kindPrices = $prices[$kind] ?? null;

                    if (! is_array($kindPrices) || ! isset($kindPrices[$credit])) {
                        throw new UnexpectedValueException('A complete initial credit price snapshot requires a PRISMA trade for every credit.');
                    }
                }
            }
        }

        $snapshot = CreditPriceSnapshot::query()->firstOrNew(['period_end' => $end->toDateString()]);
        $snapshot->fill(
            [
                'period_start' => $start->toDateString(),
                'prices' => $prices,
                'retrieved_at' => now('UTC'),
            ],
        )->save();

        $this->info('PRISMA credit prices updated.');

        return self::SUCCESS;
    }
}
