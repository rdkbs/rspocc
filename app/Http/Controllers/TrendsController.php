<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
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

        $traded = CreditPriceRetrieval::query()
            ->from('credit_price_retrievals as traded')
            ->whereColumn('traded.credit_type', 'credit_price_retrievals.credit_type')
            ->whereColumn('traded.period_start_at', '>=', 'credit_price_retrievals.period_start_at')
            ->whereColumn('traded.period_end_at', '<=', 'credit_price_retrievals.period_end_at')
            ->where('traded.status', CreditPriceRetrievalStatus::RESOLVED->value);

        $days = CreditPriceRetrieval::query()
            ->whereNull('parent_id')
            ->where('period_start_at', '>=', $start->toDateTimeString())
            ->where('period_start_at', '<', $end->addDay()->toDateTimeString())
            ->select(['credit_type', 'period_start_at', 'quantity_sold', 'status', 'child_quantity_matches'])
            ->latest('period_start_at')
            ->orderBy('credit_type')
            ->addSelect([
                'closing_price' => (clone $traded)->select('traded.last_traded_price')
                    ->latest('traded.period_start_at')->limit(1),
                'trade_value' => $traded->selectRaw('SUM(traded.quantity_sold * traded.last_traded_price)'),
            ])
            ->get();

        $excludedDates = ['inProgress' => [], 'couldNotVerify' => []];
        $trades = [];
        foreach ($days as $day) {
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

            $closingPrice = $day->getAttribute('closing_price');
            $tradeValue = $day->getAttribute('trade_value');
            $volume = $day->quantity_sold === null ? null : (float) $day->quantity_sold;
            $trades[$day->credit_type][$date] = [
                'price' => is_numeric($closingPrice) ? (float) $closingPrice : null,
                'volume' => $volume,
                'tradeValue' => $volume === 0.0 ? 0.0 : (is_numeric($tradeValue) ? (float) $tradeValue : null),
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
}
