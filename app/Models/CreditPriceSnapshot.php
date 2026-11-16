<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CreditPriceSnapshotFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $period_start
 * @property string $period_end
 * @property array<string, array<string, int|float>> $prices
 * @property array<string, array{rate: int|float, date: string}>|null $exchange_rates
 * @property Carbon $retrieved_at
 */
#[Fillable(['period_start', 'period_end', 'prices', 'exchange_rates', 'retrieved_at'])]
#[WithoutTimestamps]
final class CreditPriceSnapshot extends Model
{
    /** @var array<string, array<string, float>> */
    public const array BASELINE_PRICES = [
        'is' => ['cspo' => 3.67, 'cspko' => 88.71, 'cspke' => 0.1],
        'standard' => ['cspo' => 0.12, 'cspko' => 18.05, 'cspke' => 0.25],
    ];

    public const string BASELINE_CHECKED_ON = '2026-11-15T00:00:00.000000Z';

    /** @use HasFactory<CreditPriceSnapshotFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prices' => 'array',
            'exchange_rates' => 'array',
            'retrieved_at' => 'datetime',
        ];
    }
}
