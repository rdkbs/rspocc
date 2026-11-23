<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\PrismaCreditAnalyticsCollector;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\Middleware\WithoutOverlapping;

#[Backoff(180)]
#[MaxExceptions(3)]
#[Timeout(75)]
#[Tries(0)]
#[UniqueFor(7 * 24 * 60 * 60)]
final class BackfillCreditPriceAnalytics implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct(public string $day, public ?int $intervalId = null) {}

    public function uniqueId(): string
    {
        return $this->intervalId === null ? $this->day : "interval:{$this->intervalId}";
    }

    /** @return list<WithoutOverlapping> */
    public function middleware(): array
    {
        return [self::overlapGuard()];
    }

    public static function overlapGuard(): WithoutOverlapping
    {
        return (new WithoutOverlapping('credit-analytics'))->releaseAfter(180)->expireAfter(90);
    }

    public function handle(PrismaCreditAnalyticsCollector $collector): void
    {
        $needsRetry = $collector->collect(
            CarbonImmutable::parse($this->day, 'UTC'),
            requestLimit: 6,
            timeLimit: 15,
            intervalId: $this->intervalId,
        );

        if ($needsRetry) {
            $this->release(180);
        }
    }
}
