<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Mail\Message;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\MaxExceptions;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Support\ConfigurationUrlParser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

#[Backoff(180)]
#[MaxExceptions(3)]
#[Tries(0)]
final class SendCreditAnalyticsSummary implements ShouldQueue
{
    use Queueable;

    /** @param list<string> $days */
    public function __construct(public string $email, public array $days, public string $mailer) {}

    public function handle(): void
    {
        $connection = config('queue.connections.database.connection');
        $collectionPending = DB::connection(\is_string($connection) ? $connection : null)
            ->table(config()->string('queue.connections.database.table'))
            ->where('queue', 'credit-analytics')
            ->where('payload->displayName', BackfillCreditPriceAnalytics::class)
            ->select('payload->data->command as command')
            ->cursor()
            ->contains(function (object $row): bool {
                $command = $row->command ?? null;

                // Read the date without unserializing queued PHP objects.
                return \is_string($command)
                    && preg_match('/s:3:"day";s:10:"(\d{4}-\d{2}-\d{2})";/', $command, $matches) === 1
                    && \in_array($matches[1], $this->days, true);
            });

        if ($collectionPending) {
            $this->release(180);

            return;
        }

        $counts = CreditPriceRetrieval::query()
            ->whereNull('parent_id')
            ->whereIn(DB::raw('DATE(period_start_at)'), $this->days)
            ->get(['status', 'child_quantity_matches'])
            ->countBy(static fn (CreditPriceRetrieval $retrieval): string => match ($retrieval->status) {
                CreditPriceRetrievalStatus::MIXED => match ($retrieval->child_quantity_matches) {
                    true => 'verified_split',
                    false => 'unresolved',
                    null => 'unfinished_split',
                },
                default => $retrieval->status->value,
            })
            ->sortKeys();

        $lines = [\sprintf('UTC dates selected: %d', \count($this->days))];
        foreach ($counts as $status => $count) {
            $lines[] = sprintf('%s: %d', $status, $count);
        }

        self::deliveryMailer($this->mailer)->raw(implode("\n", $lines), function (Message $message): void {
            $message->to($this->email)->subject('PRISMA credit analytics summary');
        });
    }

    public static function deliveryMailer(string $name): Mailer
    {
        if (! self::deliversEmail($name)) {
            throw new RuntimeException('The analytics summary mailer must deliver email without log or array fallbacks.');
        }

        return Mail::mailer($name);
    }

    /** @param list<string> $ancestors */
    private static function deliversEmail(string $mailer, array $ancestors = []): bool
    {
        $config = config("mail.mailers.{$mailer}");
        if (\in_array($mailer, $ancestors, true) || ! \is_array($config)) {
            return false;
        }

        if (isset($config['url'])) {
            if (! \is_string($config['url'])) {
                return false;
            }

            $config = array_merge($config, (new ConfigurationUrlParser)->parseConfiguration($config['url']));
            $config['transport'] = $config['driver'] ?? null;
        }

        $transport = $config['transport'] ?? null;
        if (! \is_string($transport) || \in_array($transport, ['log', 'array'], true)) {
            return false;
        }

        if (! \in_array($transport, ['failover', 'roundrobin'], true)) {
            return true;
        }

        $children = $config['mailers'] ?? null;
        if (! \is_array($children) || $children === []) {
            return false;
        }

        $ancestors[] = $mailer;
        foreach ($children as $child) {
            if (! \is_string($child) || ! self::deliversEmail($child, $ancestors)) {
                return false;
            }
        }

        return true;
    }
}
