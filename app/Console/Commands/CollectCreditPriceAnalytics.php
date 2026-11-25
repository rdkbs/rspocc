<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\BackfillCreditPriceAnalytics;
use App\Jobs\SendCreditAnalyticsSummary;
use App\Services\PrismaCreditAnalyticsCollector;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Throwable;

#[Signature('credits:collect-analytics
    {--clear-unresolved : Discard old results and reset all unresolved daily retrievals}
    {--email= : Send a summary to this address after jobs for the selected dates finish}')]
#[Description('Queue unfinished PRISMA analytics days from January 1, 2025 through yesterday in UTC')]
final class CollectCreditPriceAnalytics extends Command
{
    public const string SCHEDULE_TIME_UTC = '00:15';

    public function handle(PrismaCreditAnalyticsCollector $collector): int
    {
        $email = $this->option('email');
        if ($this->input->hasParameterOption('--email') && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $this->error('Provide a valid address with --email.');

            return self::INVALID;
        }

        $mailer = null;
        if ($email !== null) {
            try {
                $mailer = config()->string('mail.default');
                SendCreditAnalyticsSummary::deliveryMailer($mailer);
            } catch (Throwable) {
                $this->error('Configure MAIL_MAILER to deliver email without log or array fallbacks before using --email.');

                return self::INVALID;
            }
        }

        $yesterday = CarbonImmutable::yesterday('UTC');
        $firstDay = CarbonImmutable::parse('2025-01-01', 'UTC');
        if ($this->option('clear-unresolved')) {
            $job = new BackfillCreditPriceAnalytics($yesterday->toDateString());
            $key = BackfillCreditPriceAnalytics::overlapGuard()->getLockKey($job);
            $lock = Cache::lock($key, 300);

            if (! $lock->get()) {
                $this->error('An analytics job is running. Try again after it finishes.');

                return self::FAILURE;
            }

            try {
                $reset = $collector->clearUnresolved();
            } finally {
                $lock->release();
            }

            $this->info(\sprintf('Reset %d unresolved daily retrievals.', $reset));
        }

        $days = $collector->unfinishedDays($firstDay, $yesterday);
        $start = now();

        foreach ($days as $index => $day) {
            dispatch(new BackfillCreditPriceAnalytics($day))
                ->onConnection('database')
                ->onQueue('credit-analytics')
                ->delay($start->copy()->addMinutes($index));
        }

        if ($email !== null) {
            dispatch(new SendCreditAnalyticsSummary($email, $days, $mailer))
                ->onConnection('database')
                ->onQueue('credit-analytics')
                ->delay($start->copy()->addMinutes(\count($days)));
        }

        if ($days === []) {
            $this->info('No unfinished UTC days to queue.');
        } else {
            $this->info(\sprintf(
                'Submitted %d unfinished days from %s through %s (UTC). Already queued days are reused.',
                \count($days),
                min($days),
                max($days),
            ));
        }

        return self::SUCCESS;
    }
}
