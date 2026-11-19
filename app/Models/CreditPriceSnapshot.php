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
 * @property Carbon $retrieved_at
 */
#[Fillable(['period_start', 'period_end', 'prices', 'retrieved_at'])]
#[WithoutTimestamps]
final class CreditPriceSnapshot extends Model
{
    /** @use HasFactory<CreditPriceSnapshotFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'prices' => 'array',
            'retrieved_at' => 'datetime',
        ];
    }
}
