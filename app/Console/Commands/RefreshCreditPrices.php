<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\CreditPriceSnapshot;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;
use UnexpectedValueException;

#[Description('Retrieve PRISMA year-to-date last-traded credit prices')]
#[Signature('credits:refresh-prices')]
final class RefreshCreditPrices extends Command
{
    public function handle(): int
    {
        $end = today('UTC');
        $start = $end->copy()->startOfYear();
        $previous = CreditPriceSnapshot::query()->orderByDesc('period_end')->first();
        $prices = $previous->prices ?? CreditPriceSnapshot::BASELINE_PRICES;
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

        CreditPriceSnapshot::updateOrCreate(
            ['period_end' => $end->toDateString()],
            [
                'period_start' => $start->toDateString(),
                'prices' => $prices,
                'retrieved_at' => now('UTC'),
            ],
        );

        $this->info('PRISMA credit prices updated.');

        return self::SUCCESS;
    }
}
