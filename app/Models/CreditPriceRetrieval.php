<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\CreditPriceRetrievalStatus;
use Carbon\CarbonImmutable;
use Database\Factories\CreditPriceRetrievalFactory;
use Illuminate\Database\Eloquent\Attributes\DateFormat;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $credit_type
 * @property int|null $parent_id
 * @property CarbonImmutable $period_start_at
 * @property CarbonImmutable $period_end_at
 * @property CreditPriceRetrievalStatus $status
 * @property string|null $quantity_sold
 * @property string|null $low_price
 * @property string|null $high_price
 * @property string|null $last_traded_price
 * @property bool|null $child_quantity_matches
 * @property int|null $http_status
 * @property string|null $response_body
 * @property string|null $response_sha256
 * @property string|null $error_message
 * @property int $attempts
 * @property CarbonImmutable|null $retrieved_at
 */
#[Fillable([
    'credit_type', 'period_start_at', 'period_end_at', 'parent_id', 'status', 'quantity_sold',
    'low_price', 'high_price', 'last_traded_price', 'child_quantity_matches', 'http_status',
    'response_body', 'response_sha256', 'error_message', 'attempts', 'retrieved_at',
])]
#[DateFormat('Y-m-d H:i:s.v')]
class CreditPriceRetrieval extends Model
{
    /** @use HasFactory<CreditPriceRetrievalFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<CreditPriceRetrieval, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * @return HasMany<CreditPriceRetrieval, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => CreditPriceRetrievalStatus::class,
            'period_start_at' => 'immutable_datetime',
            'period_end_at' => 'immutable_datetime',
            'quantity_sold' => 'decimal:8',
            'low_price' => 'decimal:8',
            'high_price' => 'decimal:8',
            'last_traded_price' => 'decimal:8',
            'child_quantity_matches' => 'boolean',
            'retrieved_at' => 'immutable_datetime',
        ];
    }
}
