<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CreditPriceRetrievalStatus;
use App\Jobs\BackfillCreditPriceAnalytics;
use App\Models\CreditPriceRetrieval;
use Brick\Math\BigDecimal;
use Brick\Math\Exception\NumberFormatException;
use Brick\Math\RoundingMode;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\DB;
use JsonException;

final class PrismaCreditAnalyticsCollector
{
    /**
     * @var list<string>
     */
    private const array CREDIT_TYPES = ['CSPO', 'CSPKO', 'CSPKE', 'IS_CSPO', 'IS_CSPKO', 'IS_CSPKE'];

    private const int RETRY_LIMIT = 24;

    private const int RETRY_COOLDOWN_HOURS = 24;

    private const string MAX_DECIMAL_VALUE = '9999999999999999.99999999';

    public function __construct(private readonly PrismaCreditPriceProvider $priceProvider) {}

    public function clearUnresolved(): int
    {
        $count = 0;

        CreditPriceRetrieval::query()
            ->whereNull('parent_id')
            ->where('status', CreditPriceRetrievalStatus::UNRESOLVED->value)
            ->eachById(function (CreditPriceRetrieval $root) use (&$count): void {
                $this->resetTree($root);

                $count++;
            });

        return $count;
    }

    private function resetTree(CreditPriceRetrieval $root): void
    {
        DB::transaction(function () use ($root): void {
            $childIds = DB::table('credit_price_retrievals')
                ->where('credit_type', $root->credit_type)
                ->where('period_start_at', '>=', $root->period_start_at->format('Y-m-d H:i:s.v'))
                ->where('period_end_at', '<=', $root->period_end_at->format('Y-m-d H:i:s.v'))
                ->whereNotNull('parent_id')
                ->orderByDesc('id')
                ->pluck('id');

            // Split children are inserted after their parents, so delete leaves first.
            foreach ($childIds as $id) {
                DB::table('credit_price_retrievals')->where('id', $id)->delete();
            }

            $root->update([
                'status' => CreditPriceRetrievalStatus::PENDING,
                'attempts' => 0,
                'quantity_sold' => null,
                'low_price' => null,
                'high_price' => null,
                'last_traded_price' => null,
                'child_quantity_matches' => null,
                'http_status' => null,
                'response_body' => null,
                'response_sha256' => null,
                'error_message' => null,
                'retrieved_at' => null,
            ]);
        });
    }

    /** @return list<string> */
    public function unfinishedDays(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $this->seedDailyTasks($from, $to);

        $days = DB::table('credit_price_retrievals')
            ->whereNull('parent_id')
            ->whereBetween('period_start_at', [
                $from->format('Y-m-d H:i:s.v'),
                $this->dayEnd($to)->format('Y-m-d H:i:s.v'),
            ])
            ->where(function (QueryBuilder $query): void {
                $query->whereIn('status', [CreditPriceRetrievalStatus::PENDING->value, CreditPriceRetrievalStatus::MIXED->value])
                    ->orWhere(function (QueryBuilder $query): void {
                        $query->where('status', CreditPriceRetrievalStatus::FAILED->value);
                        $query->where(function (QueryBuilder $query): void {
                            $query->where('attempts', '<', self::RETRY_LIMIT)
                                ->orWhere('retrieved_at', '<=', now('UTC')->subHours(self::RETRY_COOLDOWN_HOURS));
                        });
                    });
            })
            ->whereNull('child_quantity_matches')
            ->selectRaw('DATE(period_start_at) AS utc_day')
            ->distinct()
            ->orderByDesc('utc_day')
            ->limit(96)
            ->pluck('utc_day')
            ->all();

        return array_values(array_filter($days, \is_string(...)));
    }

    public function collect(CarbonImmutable $day, int $requestLimit, int $timeLimit, ?int $intervalId = null): bool
    {
        $legacyRoots = CreditPriceRetrieval::query()
            ->whereNull('parent_id')
            ->where('status', CreditPriceRetrievalStatus::MIXED->value)
            ->whereNull('child_quantity_matches')
            ->where('period_start_at', $day->format('Y-m-d H:i:s.v'))
            ->whereExists(function (QueryBuilder $query): void {
                $query->from('credit_price_retrievals as left_child')
                    ->join('credit_price_retrievals as right_child', 'left_child.parent_id', '=', 'right_child.parent_id')
                    ->whereColumn('left_child.credit_type', 'credit_price_retrievals.credit_type')
                    ->whereColumn('left_child.period_start_at', '>=', 'credit_price_retrievals.period_start_at')
                    ->whereColumn('right_child.period_end_at', '<=', 'credit_price_retrievals.period_end_at')
                    ->whereColumn('left_child.period_end_at', '<', 'right_child.period_start_at');
            })
            ->get();

        foreach ($legacyRoots as $root) {
            DB::transaction(function () use ($root): void {
                CreditPriceRetrieval::query()
                    ->whereNotNull('parent_id')
                    ->where('credit_type', $root->credit_type)
                    ->where('period_start_at', '>=', $root->period_start_at->format('Y-m-d H:i:s.v'))
                    ->where('period_end_at', '<=', $root->period_end_at->format('Y-m-d H:i:s.v'))
                    ->whereIn('status', [
                        CreditPriceRetrievalStatus::PENDING->value,
                        CreditPriceRetrievalStatus::FAILED->value,
                        CreditPriceRetrievalStatus::MIXED->value,
                    ])
                    ->whereNull('child_quantity_matches')
                    ->update(['status' => CreditPriceRetrievalStatus::UNRESOLVED->value]);

                $root->update([
                    'status' => CreditPriceRetrievalStatus::UNRESOLVED,
                    'error_message' => 'This split uses legacy boundaries. Run credits:collect-analytics --clear-unresolved to rebuild it.',
                ]);
            });
        }

        $deadline = microtime(true) + $timeLimit;
        $this->resetExhaustedRetries($day, $intervalId);
        $this->reconcileReadyParents($day, $day);

        $this->dispatchPendingChildren($day, $intervalId);

        $processedIds = [];
        while (\count($processedIds) < $requestLimit && microtime(true) < $deadline) {
            $task = $this->nextTask($day, $processedIds, $intervalId);

            if ($task === null) {
                break;
            }

            $processedIds[] = $task->id;
            $this->collectTask($task);
            $this->reconcileReadyParents($day, $day);
        }

        return $this->nextTask($day, [], $intervalId) !== null;
    }

    private function seedDailyTasks(CarbonImmutable $from, CarbonImmutable $to): void
    {
        $existingDailyTasks = [];
        $existingRows = DB::table('credit_price_retrievals')
            ->whereNull('parent_id')
            ->whereBetween('period_start_at', [
                $from->format('Y-m-d H:i:s.v'),
                $this->dayEnd($to)->format('Y-m-d H:i:s.v'),
            ])
            ->get(['credit_type', 'period_start_at']);

        foreach ($existingRows as $row) {
            if (is_string($row->credit_type) && is_string($row->period_start_at)) {
                $existingDailyTasks[$row->credit_type][substr($row->period_start_at, 0, 10)] = true;
            }
        }

        $rows = [];
        $timestamp = now('UTC')->format('Y-m-d H:i:s.v');

        for ($date = $from->startOfDay(); $date <= $to->startOfDay(); $date = $date->addDay()) {
            foreach (self::CREDIT_TYPES as $creditType) {
                $day = $date->toDateString();

                if (isset($existingDailyTasks[$creditType][$day])) {
                    continue;
                }

                $existingDailyTasks[$creditType][$day] = true;
                $rows[] = [
                    'credit_type' => $creditType,
                    'period_start_at' => $date->format('Y-m-d H:i:s.v'),
                    'period_end_at' => $this->dayEnd($date)->format('Y-m-d H:i:s.v'),
                    'status' => CreditPriceRetrievalStatus::PENDING->value,
                    'attempts' => 0,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];

                if (\count($rows) === 500) {
                    DB::table('credit_price_retrievals')->insertOrIgnore($rows);
                    $rows = [];
                }
            }
        }

        if ($rows !== []) {
            DB::table('credit_price_retrievals')->insertOrIgnore($rows);
        }
    }

    /**
     * @param  list<int>  $excludedIds
     */
    private function nextTask(CarbonImmutable $day, array $excludedIds, ?int $intervalId): ?CreditPriceRetrieval
    {
        $tasks = CreditPriceRetrieval::query()
            ->where('period_start_at', '>=', $day->format('Y-m-d H:i:s.v'))
            ->where('period_end_at', '<=', $this->dayEnd($day)->format('Y-m-d H:i:s.v'))
            ->where(function (Builder $query): void {
                $query->where('status', CreditPriceRetrievalStatus::PENDING->value)
                    ->orWhere(function (Builder $query): void {
                        $query->where('status', CreditPriceRetrievalStatus::FAILED->value);
                        $this->whereRetryWindowOpen($query);
                    });
            })
            ->whereNotIn('id', $excludedIds);

        if ($intervalId === null) {
            $tasks->whereNull('parent_id');
        } else {
            $tasks->whereKey($intervalId);
        }

        return $tasks->orderBy('id')->first();
    }

    private function dispatchPendingChildren(CarbonImmutable $day, ?int $parentId): void
    {
        $children = CreditPriceRetrieval::query()
            ->whereNotNull('parent_id')
            ->whereBetween('period_start_at', [$day->format('Y-m-d H:i:s.v'), $this->dayEnd($day)->format('Y-m-d H:i:s.v')])
            ->where(function (Builder $query): void {
                $query->where('status', CreditPriceRetrievalStatus::PENDING->value)
                    ->orWhere(function (Builder $query): void {
                        $query->where('status', CreditPriceRetrievalStatus::FAILED->value);
                        $this->whereRetryWindowOpen($query);
                    });
            });

        if ($parentId !== null) {
            $children->where('parent_id', $parentId);
        }

        foreach ($children->orderBy('id')->get(['id']) as $child) {
            dispatch(new BackfillCreditPriceAnalytics($day->toDateString(), $child->id))
                ->onConnection('database')
                ->onQueue('credit-analytics');
        }
    }

    private function collectTask(CreditPriceRetrieval $task): void
    {
        try {
            $response = $this->priceProvider->fetchRange($task->credit_type, $task->period_start_at, $task->period_end_at);
        } catch (ConnectionException|LockTimeoutException $exception) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::FAILED,
                null,
                null,
                $exception->getMessage(),
            );

            return;
        }

        $body = $response->body();
        if (! $response->successful()) {
            $retryable = $response->serverError() || in_array($response->status(), [408, 429], true);

            $this->storeRetrieval(
                $task,
                $retryable ? CreditPriceRetrievalStatus::FAILED : CreditPriceRetrievalStatus::UNRESOLVED,
                $response,
                null,
                'PRISMA returned HTTP '.$response->status().'.',
            );

            return;
        }

        try {
            $data = $this->decodeJsonPreservingNumbers($body);
        } catch (JsonException $exception) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::FAILED,
                $response,
                null,
                'PRISMA returned invalid JSON: '.$exception->getMessage(),
            );

            return;
        }

        if (! \is_array($data) || array_is_list($data)) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::FAILED,
                $response,
                null,
                'PRISMA returned an unexpected response shape.',
            );

            return;
        }

        $quantity = $this->number($data['quantity'] ?? null);

        if ($quantity === null) {
            $this->storeRetrieval(
                $task, CreditPriceRetrievalStatus::FAILED, $response, null, 'PRISMA returned a missing or invalid quantity.',
            );

            return;
        }

        if (BigDecimal::of($quantity)->isZero()) {
            $this->storeRetrieval(
                $task, CreditPriceRetrievalStatus::NO_TRADES, $response, ['quantity_sold' => $quantity], null,
            );

            return;
        }

        $low = $this->number($data['low'] ?? null);
        $high = $this->number($data['high'] ?? null);
        $lastTradedPrice = $this->number($data['lastTradedPrice'] ?? null);

        if ($low === null || $high === null || $lastTradedPrice === null
            || BigDecimal::of($low)->isGreaterThan($high)
            || BigDecimal::of($lastTradedPrice)->isLessThan($low)
            || BigDecimal::of($lastTradedPrice)->isGreaterThan($high)) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::FAILED,
                $response,
                ['quantity_sold' => $quantity],
                'PRISMA returned missing or invalid price values.',
            );

            return;
        }

        $values = [
            'quantity_sold' => $quantity,
            'low_price' => $low,
            'high_price' => $high,
            'last_traded_price' => $lastTradedPrice,
        ];

        if ($low === $high) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::RESOLVED,
                $response,
                $values,
                null,
            );

            return;
        }

        if ($this->splitRange($task->period_start_at, $task->period_end_at) === null) {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::UNRESOLVED,
                $response,
                $values,
                CreditPriceRetrieval::MIXED_MILLISECOND_MESSAGE,
            );

            return;
        }

        DB::transaction(function () use ($task, $response, $values): void {
            $this->storeRetrieval(
                $task,
                CreditPriceRetrievalStatus::MIXED,
                $response,
                $values,
                null,
            );
            $this->seedSplitTasks($task);
        });
        $this->dispatchPendingChildren($task->period_start_at->startOfDay(), $task->id);
    }

    private function seedSplitTasks(CreditPriceRetrieval $parent): void
    {
        $ranges = $this->splitRange($parent->period_start_at, $parent->period_end_at);

        if ($ranges === null) {
            return;
        }

        $timestamp = now('UTC')->format('Y-m-d H:i:s.v');
        $rows = [];

        foreach ($ranges as [$start, $end]) {
            $rows[] = [
                'credit_type' => $parent->credit_type,
                'period_start_at' => $start->format('Y-m-d H:i:s.v'),
                'period_end_at' => $end->format('Y-m-d H:i:s.v'),
                'parent_id' => $parent->id,
                'status' => CreditPriceRetrievalStatus::PENDING->value,
                'attempts' => 0,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        DB::table('credit_price_retrievals')->insertOrIgnore($rows);
    }

    private function reconcileReadyParents(CarbonImmutable $from, CarbonImmutable $to): void
    {
        do {
            $parentCount = DB::transaction(function () use ($from, $to): int {
                $parents = CreditPriceRetrieval::query()
                    ->with('children')
                    ->where('status', CreditPriceRetrievalStatus::MIXED->value)
                    ->whereNull('child_quantity_matches')
                    ->where('period_start_at', '>=', $from->format('Y-m-d H:i:s.v'))
                    ->where('period_end_at', '<=', $this->dayEnd($to)->format('Y-m-d H:i:s.v'))
                    ->whereHas('children')
                    ->whereDoesntHave('children', function ($query): void {
                        $query->whereIn('status', [CreditPriceRetrievalStatus::PENDING->value, CreditPriceRetrievalStatus::FAILED->value])
                            ->orWhere(function ($query): void {
                                $query->where('status', CreditPriceRetrievalStatus::MIXED->value)
                                    ->whereNull('child_quantity_matches');
                            });
                    })
                    ->lockForUpdate()
                    ->get();

                foreach ($parents as $parent) {
                    $this->reconcileParent($parent);
                }

                return $parents->count();
            });
        } while ($parentCount > 0);
    }

    private function reconcileParent(CreditPriceRetrieval $parent): void
    {
        $children = $parent->children;

        if ($children->contains('status', CreditPriceRetrievalStatus::UNRESOLVED)) {
            $parent->update([
                'status' => CreditPriceRetrievalStatus::UNRESOLVED,
                'error_message' => 'A child interval could not be resolved.',
            ]);

            return;
        }

        if ($parent->quantity_sold === null
            || $children->contains(fn (CreditPriceRetrieval $child): bool => $child->quantity_sold === null)) {
            $parent->update([
                'status' => CreditPriceRetrievalStatus::UNRESOLVED,
                'error_message' => 'A completed interval is missing its quantity.',
            ]);

            return;
        }

        $childQuantity = BigDecimal::sum(0, ...$children->map(
            static fn (CreditPriceRetrieval $child): string => $child->quantity_sold ?? '0',
        )->all());
        $matches = $childQuantity->isEqualTo($parent->quantity_sold);

        $parent->update([
            'child_quantity_matches' => $matches,
            'status' => $matches ? CreditPriceRetrievalStatus::MIXED : CreditPriceRetrievalStatus::UNRESOLVED,
            'error_message' => $matches ? null : 'Child interval quantities do not match the parent query.',
        ]);

    }

    /**
     * @return array{0: array{0: CarbonImmutable, 1: CarbonImmutable}, 1: array{0: CarbonImmutable, 1: CarbonImmutable}}|null
     */
    private function splitRange(CarbonImmutable $start, CarbonImmutable $end): ?array
    {
        $distance = (int) $start->diffInMilliseconds($end);

        if ($distance < 2) {
            return null;
        }

        $midpoint = $start->addMilliseconds(intdiv($distance, 2));

        return [
            [$start, $midpoint],
            [$midpoint, $end],
        ];
    }

    /**
     * @param  array{quantity_sold?: string|null, low_price?: string|null, high_price?: string|null, last_traded_price?: string|null}|null  $values
     */
    private function storeRetrieval(
        CreditPriceRetrieval $retrieval,
        CreditPriceRetrievalStatus $status,
        ?Response $response,
        ?array $values,
        ?string $errorMessage,
    ): void {
        $attempts = $retrieval->attempts + 1;
        $body = $response?->body();
        $retrieval->fill([
            'status' => $status,
            'quantity_sold' => $values['quantity_sold'] ?? null,
            'low_price' => $values['low_price'] ?? null,
            'high_price' => $values['high_price'] ?? null,
            'last_traded_price' => $values['last_traded_price'] ?? null,
            'child_quantity_matches' => null,
            'http_status' => $response?->status(),
            'response_body' => $body,
            'response_sha256' => $body === null ? null : hash('sha256', $body),
            'error_message' => $errorMessage,
            'attempts' => $attempts,
            'retrieved_at' => now('UTC'),
        ])->save();
    }

    private function number(mixed $value): ?string
    {
        if ((! \is_int($value) && ! \is_string($value)) || ! is_numeric($value)) {
            return null;
        }

        try {
            $number = BigDecimal::of((string) $value);
        } catch (NumberFormatException) {
            return null;
        }

        if ($number->isNegative()) {
            return null;
        }

        $number = $number->toScale(8, RoundingMode::HalfUp);

        return $number->isGreaterThan(self::MAX_DECIMAL_VALUE) ? null : (string) $number;
    }

    private function decodeJsonPreservingNumbers(string $body): mixed
    {
        $json = preg_replace_callback(
            '/"(?:\\\\.|[^"\\\\])*"(*SKIP)(*F)|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/',
            static fn (array $matches): string => "\"{$matches[0]}\"",
            $body,
        );

        if ($json === null) {
            throw new JsonException('Unable to preserve numeric values in the PRISMA response.');
        }

        return json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }

    /** @param Builder<CreditPriceRetrieval> $query */
    private function whereRetryWindowOpen(Builder $query): void
    {
        $query->where(function (Builder $query): void {
            $query->where('attempts', '<', self::RETRY_LIMIT)
                ->orWhere('retrieved_at', '<=', now('UTC')->subHours(self::RETRY_COOLDOWN_HOURS));
        });
    }

    private function resetExhaustedRetries(CarbonImmutable $day, ?int $intervalId): void
    {
        $query = CreditPriceRetrieval::query()
            ->where('status', CreditPriceRetrievalStatus::FAILED->value)
            ->where('attempts', '>=', self::RETRY_LIMIT)
            ->where('retrieved_at', '<=', now('UTC')->subHours(self::RETRY_COOLDOWN_HOURS));

        if ($intervalId === null) {
            $query->whereNull('parent_id')
                ->where('period_start_at', '>=', $day->format('Y-m-d H:i:s.v'))
                ->where('period_end_at', '<=', $this->dayEnd($day)->format('Y-m-d H:i:s.v'));
        } else {
            $query->whereKey($intervalId);
        }

        $query->update(['attempts' => 0]);
    }

    private function dayEnd(CarbonImmutable $date): CarbonImmutable
    {
        return $date->startOfDay()->addDay()->subMilliseconds(1);
    }
}
