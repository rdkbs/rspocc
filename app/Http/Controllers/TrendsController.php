<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Brick\Math\BigDecimal;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class TrendsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $today = CarbonImmutable::today('UTC');
        $latest = $today->subDay();
        $firstDate = '2025-01-01';
        $request->validate([
            'period' => ['sometimes', 'required', 'in:week,month,three-months,90-days,six-months,180-days,last-7-days,last-30-days,last-365-days,year,custom'],
            'from' => ['required_if:period,custom', 'required_with:to', 'date_format:Y-m-d', 'after_or_equal:'.$firstDate],
            'to' => ['required_if:period,custom', 'required_with:from', 'date_format:Y-m-d', 'after_or_equal:from', 'before_or_equal:'.$latest->toDateString()],
        ]);
        $period = $request->filled('from') ? 'custom' : $request->string('period', 'month')->toString();
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
                    ->where('traded.status', CreditPriceRetrievalStatus::RESOLVED->value);
            })
            ->whereNull('daily.parent_id')
            ->where('daily.period_start_at', '>=', $start->toDateTimeString())
            ->where('daily.period_start_at', '<', $end->addDay()->toDateTimeString())
            ->select([
                'daily.id', 'daily.credit_type', 'daily.period_start_at', 'daily.quantity_sold',
                'daily.status', 'daily.child_quantity_matches',
                'traded.quantity_sold as traded_quantity', 'traded.last_traded_price',
            ])
            ->withCasts(['traded_quantity' => 'decimal:8'])
            ->latest('daily.period_start_at')
            ->orderBy('daily.credit_type')
            ->latest('traded.period_start_at')
            ->get()
            ->groupBy('id');

        $excludedDates = ['inProgress' => [], 'couldNotVerify' => []];
        $trades = [];
        foreach ($days as $intervals) {
            $day = $intervals->firstOrFail();
            $date = $day->period_start_at->toDateString();
            $status = $day->status;
            if ($status !== CreditPriceRetrievalStatus::RESOLVED
                && $status !== CreditPriceRetrievalStatus::NO_TRADES
                && ! ($status === CreditPriceRetrievalStatus::MIXED && $day->child_quantity_matches === true)) {
                $group = match ($status) {
                    CreditPriceRetrievalStatus::UNRESOLVED => 'couldNotVerify',
                    CreditPriceRetrievalStatus::PENDING, CreditPriceRetrievalStatus::FAILED => 'inProgress',
                    CreditPriceRetrievalStatus::MIXED => $day->child_quantity_matches === null ? 'inProgress' : 'couldNotVerify',
                };

                $excludedDates[$group][$date] ??= ['date' => $date, 'creditTypes' => []];
                $excludedDates[$group][$date]['creditTypes'][] = $day->credit_type;

                continue;
            }

            $closingPrice = $day->last_traded_price;
            $tradeValue = null;
            foreach ($intervals as $interval) {
                $quantity = $interval->getAttribute('traded_quantity');
                if (is_string($quantity) && $interval->last_traded_price !== null) {
                    $value = BigDecimal::of($quantity)->multipliedBy($interval->last_traded_price);
                    $tradeValue = $tradeValue === null ? $value : $tradeValue->plus($value);
                }
            }
            $volume = $day->quantity_sold === null ? null : (float) $day->quantity_sold;
            $tradeValue = $volume === 0.0 ? '0' : ($tradeValue === null ? null : (string) $tradeValue->strippedOfTrailingZeros());
            $trades[$day->credit_type][$date] = [
                'price' => is_numeric($closingPrice) ? (float) $closingPrice : null,
                'volume' => $volume,
                'tradeValue' => $tradeValue === null ? null : (float) $tradeValue,
                'csvValues' => [
                    $this->csvDecimal($day->quantity_sold),
                    $this->csvDecimal($closingPrice),
                    $tradeValue,
                ],
            ];
        }

        return Inertia::render('trends', [
            'startDate' => $start->toDateString(),
            'period' => $period,
            'endDate' => $end->toDateString(),
            'firstDate' => $firstDate,
            'latestDate' => $latest->toDateString(),
            'excludedDates' => array_map(array_values(...), $excludedDates),
            'trades' => $trades,
        ]);
    }

    private function csvDecimal(?string $value): ?string
    {
        return $value === null ? null : (string) BigDecimal::of($value)->strippedOfTrailingZeros();
    }
}
