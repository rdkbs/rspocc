<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\BackfillCreditPriceAnalytics;
use App\Services\PrismaCreditAnalyticsCollector;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('credits:collect-analytics')]
#[Description('Queue unfinished PRISMA analytics days from January 1, 2026 through yesterday in UTC')]
final class CollectCreditPriceAnalytics extends Command
{
    public function handle(PrismaCreditAnalyticsCollector $collector): int
    {
        $yesterday = CarbonImmutable::yesterday('UTC');
        $firstDay = CarbonImmutable::parse('2026-01-01', 'UTC');
        $days = $collector->unfinishedDays($firstDay, $yesterday);
        $start = now();

        foreach ($days as $index => $day) {
            dispatch(new BackfillCreditPriceAnalytics($day))
                ->onConnection('database')
                ->onQueue('credit-analytics')
                ->delay($start->copy()->addMinutes(3 * $index));
        }

        $this->info(\sprintf('Submitted %d unfinished UTC days for collection. Already queued days are reused.', \count($days)));

        return self::SUCCESS;
    }
}
