<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\ExchangeRateSnapshotFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $snapshot_date
 * @property array<string, array{rate: int|float, date: string}> $rates
 * @property Carbon $retrieved_at
 */
#[Fillable(['snapshot_date', 'rates', 'retrieved_at'])]
#[WithoutTimestamps]
final class ExchangeRateSnapshot extends Model
{
    /** @use HasFactory<ExchangeRateSnapshotFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rates' => 'array',
            'retrieved_at' => 'datetime',
        ];
    }
}
