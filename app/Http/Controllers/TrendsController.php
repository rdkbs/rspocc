<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Console\Commands\CollectCreditPriceAnalytics;
use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Brick\Math\BigDecimal;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class TrendsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $now = CarbonImmutable::now('UTC');
        $today = $now->startOfDay();
        $scheduledCheck = $today->setTimeFromTimeString(CollectCreditPriceAnalytics::SCHEDULE_TIME_UTC);
        $latest = $today->subDay();
        $firstDate = CollectCreditPriceAnalytics::FIRST_DAY_UTC;
        $request->validate([
            'period' => ['sometimes', 'required', 'in:week,month,three-months,90-days,six-months,180-days,last-7-days,last-30-days,last-365-days,year,custom'],
            'from' => ['required_if:period,custom', 'required_with:to', 'date_format:Y-m-d', 'after_or_equal:'.$firstDate],
            'to' => ['required_if:period,custom', 'required_with:from', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:'.$latest->toDateString()],
        ]);
        $period = $request->filled('from') ? 'custom' : $request->string('period', 'last-30-days')->toString();
        [$start, $end] = match ($period) {
            'custom' => [
                CarbonImmutable::parse($request->string('from')->toString(), 'UTC'),
                CarbonImmutable::parse($request->string('to')->toString(), 'UTC'),
            ],
            'week' => [
                $today->startOfWeek(Carbon::MONDAY)->subWeek(),
                $today->startOfWeek(Carbon::MONDAY)->subDay(),
            ],
            'month' => [
                $today->startOfMonth()->subMonthNoOverflow(),
                $today->startOfMonth()->subDay(),
            ],
            'three-months' => [$latest->subMonthsNoOverflow(3)->addDay(), $latest],
            '90-days' => [$latest->subDays(89), $latest],
            'six-months' => [$latest->subMonthsNoOverflow(6)->addDay(), $latest],
            '180-days' => [$latest->subDays(179), $latest],
            'last-7-days' => [$latest->subDays(6), $latest],
            'last-30-days' => [$latest->subDays(29), $latest],
            'last-365-days' => [$latest->subDays(364), $latest],
            'year' => [$today->startOfYear()->subYear(), $today->startOfYear()->subDay()],
            default => throw ValidationException::withMessages([
                'period' => __('validation.in', ['attribute' => 'period']),
            ]),
        };

        if ($start->addDays(365)->lt($end)) {
            throw ValidationException::withMessages([
                'to' => app()->isLocale('id') ? 'Pilih rentang maksimal 366 hari.' : 'Choose a range of up to 366 days.',
            ]);
        }

        $days = CreditPriceRetrieval::query()
            ->from('credit_price_retrievals as daily')
            ->leftJoin('credit_price_retrievals as traded', function (JoinClause $join): void {
                $join->on('traded.credit_type', '=', 'daily.credit_type')
                    ->on('traded.period_start_at', '>=', 'daily.period_start_at')
                    ->on('traded.period_end_at', '<=', 'daily.period_end_at')
                    ->where(function (JoinClause $join): void {
                        $join->where('traded.status', CreditPriceRetrievalStatus::RESOLVED->value)
                            ->orWhere('daily.status', CreditPriceRetrievalStatus::UNRESOLVED->value);
                    });
            })
            ->whereNull('daily.parent_id')
            ->where('daily.period_start_at', '>=', $start->toDateTimeString())
            ->where('daily.period_start_at', '<', $end->addDay()->toDateTimeString())
            ->select([
                'daily.id', 'daily.credit_type', 'daily.period_start_at', 'daily.quantity_sold',
                'daily.status', 'daily.child_quantity_matches', 'daily.period_end_at',
                'daily.low_price', 'daily.high_price',
                'daily.last_traded_price', 'traded.quantity_sold as traded_quantity',
                'traded.last_traded_price as traded_price', 'traded.id as interval_id',
                'traded.parent_id as interval_parent_id', 'traded.status as interval_status',
                'traded.period_start_at as interval_start', 'traded.period_end_at as interval_end',
                'traded.error_message as interval_error',
                'traded.low_price as interval_low', 'traded.high_price as interval_high',
            ])
            ->withCasts(['traded_quantity' => 'decimal:8', 'traded_price' => 'decimal:8', 'interval_id' => 'integer'])
            ->latest('daily.period_start_at')
            ->orderBy('daily.credit_type')
            ->latest('traded.period_start_at')
            ->get()
            ->groupBy('id');

        $excludedDates = ['inProgress' => [], 'couldNotVerify' => []];
        $partialSpending = [];
        $tradeIntervals = [];
        $trades = [];
        foreach ($days as $intervals) {
            $day = $intervals->firstOrFail();
            $date = $day->period_start_at->toDateString();
            $status = $day->status;
            $excludedQuantity = BigDecimal::zero();
            $partialTradeValue = false;
            if ($status === CreditPriceRetrievalStatus::UNRESOLVED) {
                $root = $intervals->firstWhere('interval_id', $day->id);
                if ($root !== null) {
                    $unresolved = $this->mixedPriceIntervals($root, $intervals->groupBy('interval_parent_id'));
                    if ($unresolved !== null && $unresolved !== []) {
                        $partialTradeValue = true;
                        foreach ($unresolved as $interval) {
                            $excludedQuantity = $excludedQuantity->plus($interval['quantity']);
                            $observation = [
                                ...$interval,
                                'creditType' => $day->credit_type,
                                'quantity' => (float) $interval['quantity'],
                                'low' => (float) $interval['low'],
                                'high' => (float) $interval['high'],
                            ];
                            $partialSpending[] = $observation;
                            $tradeIntervals[$day->credit_type][$date][] = [
                                ...$observation,
                                'csvValues' => [
                                    $this->csvDecimal($interval['quantity']),
                                    $this->csvDecimal($interval['low']),
                                    $this->csvDecimal($interval['high']),
                                    null,
                                ],
                            ];
                        }
                    }
                }
            }

            if (! $partialTradeValue
                && $status !== CreditPriceRetrievalStatus::RESOLVED
                && $status !== CreditPriceRetrievalStatus::NO_TRADES
                && ! ($status === CreditPriceRetrievalStatus::MIXED && $day->child_quantity_matches === true)) {
                $group = match ($status) {
                    CreditPriceRetrievalStatus::UNRESOLVED => 'couldNotVerify',
                    CreditPriceRetrievalStatus::PENDING, CreditPriceRetrievalStatus::FAILED => 'inProgress',
                    CreditPriceRetrievalStatus::MIXED => $day->child_quantity_matches === null ? 'inProgress' : 'couldNotVerify',
                };

                $excludedDates[$group][$date] ??= ['date' => $date, 'creditTypes' => []];
                $excludedDates[$group][$date]['creditTypes'][] = $day->credit_type;

                // Report the source's daily observation when its split cannot be reconciled.
                if ($group === 'couldNotVerify' && $day->quantity_sold !== null
                    && $day->low_price !== null && $day->high_price !== null) {
                    $tradeIntervals[$day->credit_type][$date][] = [
                        'start' => $day->period_start_at->format('Y-m-d H:i:s.v'),
                        'end' => $day->period_end_at->format('Y-m-d H:i:s.v'),
                        'quantity' => (float) $day->quantity_sold,
                        'low' => (float) $day->low_price,
                        'high' => (float) $day->high_price,
                        'csvValues' => [
                            $this->csvDecimal($day->quantity_sold),
                            $this->csvDecimal($day->low_price),
                            $this->csvDecimal($day->high_price),
                            null,
                        ],
                    ];
                }

                continue;
            }

            $closingPrice = $partialTradeValue ? $day->last_traded_price : $day->getAttribute('traded_price');
            $tradeValue = null;
            foreach ($intervals as $interval) {
                $quantity = $interval->getAttribute('traded_quantity');
                $price = $interval->getAttribute('traded_price');
                if ($interval->getAttribute('interval_status') === CreditPriceRetrievalStatus::RESOLVED->value
                    && is_string($quantity) && is_string($price)) {
                    $value = BigDecimal::of($quantity)->multipliedBy($price);
                    $tradeValue = $tradeValue === null ? $value : $tradeValue->plus($value);
                    $tradeIntervals[$day->credit_type][$date][] = [
                        'start' => $interval->getAttribute('interval_start'),
                        'end' => $interval->getAttribute('interval_end'),
                        'quantity' => (float) $quantity,
                        'low' => (float) $price,
                        'high' => (float) $price,
                        'csvValues' => [
                            $this->csvDecimal($quantity),
                            $this->csvDecimal($price),
                            $this->csvDecimal($price),
                            (string) $value->strippedOfTrailingZeros(),
                        ],
                    ];
                }
            }
            $volume = $day->quantity_sold === null ? null : (float) $day->quantity_sold;
            $tradeValue = $volume === 0.0 ? '0' : ($tradeValue === null ? null : (string) $tradeValue->strippedOfTrailingZeros());
            $trades[$day->credit_type][$date] = [
                'price' => is_numeric($closingPrice) ? (float) $closingPrice : null,
                'volume' => $volume,
                'pricedVolume' => $day->quantity_sold === null
                    ? null
                    : BigDecimal::of($day->quantity_sold)->minus($excludedQuantity)->toFloat(),
                'tradeValue' => $tradeValue === null ? null : (float) $tradeValue,
                'partialTradeValue' => $partialTradeValue,
                'csvValues' => [
                    $this->csvDecimal($day->quantity_sold),
                    $this->csvDecimal(is_string($closingPrice) ? $closingPrice : null),
                    $tradeValue,
                ],
            ];
        }

        usort($partialSpending, static fn (array $a, array $b): int => [$b['start'], $a['creditType']] <=> [$a['start'], $b['creditType']]);

        return Inertia::render('trends', [
            'startDate' => $start->toDateString(),
            'period' => $period,
            'endDate' => $end->toDateString(),
            'firstDate' => $firstDate,
            'latestDate' => $latest->toDateString(),
            'scheduledCheckAt' => $scheduledCheck->toIso8601String(),
            'scheduledCheckPending' => $now->lessThan($scheduledCheck),
            'excludedDates' => array_map(array_values(...), $excludedDates),
            'partialSpending' => $partialSpending,
            'tradeIntervals' => $tradeIntervals,
            'trades' => $trades,
        ]);
    }

    /**
     * @param  Collection<array-key, EloquentCollection<int, CreditPriceRetrieval>>  $childrenByParent
     * @return list<array{start: string, end: string, quantity: string, low: string, high: string}>|null
     */
    private function mixedPriceIntervals(CreditPriceRetrieval $interval, Collection $childrenByParent): ?array
    {
        $intervalId = $interval->getAttribute('interval_id');
        $quantity = $interval->getAttribute('traded_quantity');
        $start = $interval->getAttribute('interval_start');
        $end = $interval->getAttribute('interval_end');
        if (! is_int($intervalId) || ! is_string($quantity) || ! is_string($start) || ! is_string($end)) {
            return null;
        }

        $children = $childrenByParent->get($intervalId);
        if ($children === null) {
            if ($interval->getAttribute('interval_status') === CreditPriceRetrievalStatus::UNRESOLVED->value
                && $interval->getAttribute('interval_error') === CreditPriceRetrieval::MIXED_MILLISECOND_MESSAGE) {
                $low = $interval->getAttribute('interval_low');
                $high = $interval->getAttribute('interval_high');

                return is_numeric($low) && is_numeric($high)
                    ? [['start' => $start, 'end' => $end, 'quantity' => $quantity, 'low' => (string) $low, 'high' => (string) $high]]
                    : null;
            }

            return match ($interval->getAttribute('interval_status')) {
                CreditPriceRetrievalStatus::NO_TRADES->value => [],
                CreditPriceRetrievalStatus::RESOLVED->value => is_string($interval->getAttribute('traded_price')) ? [] : null,
                default => null,
            };
        }

        $left = $children->last();
        $right = $children->first();
        if ($children->count() !== 2 || $left === null || $right === null
            || $left->getAttribute('interval_start') !== $interval->getAttribute('interval_start')
            || $right->getAttribute('interval_end') !== $interval->getAttribute('interval_end')
            || $left->getAttribute('interval_end') !== $right->getAttribute('interval_start')) {
            return null;
        }

        $leftMixed = $this->mixedPriceIntervals($left, $childrenByParent);
        $rightMixed = $this->mixedPriceIntervals($right, $childrenByParent);
        $leftQuantity = $left->getAttribute('traded_quantity');
        $rightQuantity = $right->getAttribute('traded_quantity');
        if ($leftMixed === null || $rightMixed === null || ! is_string($leftQuantity) || ! is_string($rightQuantity)) {
            return null;
        }

        $combinedQuantity = BigDecimal::sum($leftQuantity, $rightQuantity);
        if ($combinedQuantity->isEqualTo($quantity)) {
            return [...$leftMixed, ...$rightMixed];
        }

        $boundary = $left->getAttribute('interval_end');
        $leftBoundary = array_pop($leftMixed);
        $rightBoundary = $rightMixed[0] ?? null;

        // A matching mixed-price interval at the shared boundary contributes once.
        if (is_string($boundary)
            && $leftBoundary !== null && $rightBoundary !== null
            && $leftBoundary['end'] === $boundary && $rightBoundary['start'] === $boundary
            && BigDecimal::of($leftBoundary['low'])->isEqualTo($rightBoundary['low'])
            && BigDecimal::of($leftBoundary['high'])->isEqualTo($rightBoundary['high'])
            && BigDecimal::of($leftBoundary['quantity'])->isEqualTo($rightBoundary['quantity'])
            && $combinedQuantity->minus($leftBoundary['quantity'])->isEqualTo($quantity)) {

            return [
                ...$leftMixed,
                [...$leftBoundary, 'start' => $boundary, 'end' => $boundary],
                ...array_slice($rightMixed, 1),
            ];
        }

        return null;
    }

    private function csvDecimal(?string $value): ?string
    {
        return $value === null ? null : (string) BigDecimal::of($value)->strippedOfTrailingZeros();
    }
}
