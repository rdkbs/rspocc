<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CreditPriceRetrievalStatus;
use App\Models\CreditPriceRetrieval;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditPriceRetrieval>
 */
final class CreditPriceRetrievalFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = CarbonImmutable::parse('2026-01-01 00:00:00', 'UTC');
        $response = '{"high":2,"low":2,"lastTradedPrice":2,"quantity":500}';

        return [
            'credit_type' => 'IS_CSPO',
            'period_start_at' => $start,
            'period_end_at' => $start->addDay()->subMilliseconds(1),
            'status' => CreditPriceRetrievalStatus::RESOLVED,
            'quantity_sold' => 500,
            'low_price' => 2,
            'high_price' => 2,
            'last_traded_price' => 2,
            'http_status' => 200,
            'response_body' => $response,
            'response_sha256' => hash('sha256', $response),
            'attempts' => 1,
            'retrieved_at' => CarbonImmutable::now('UTC'),
        ];
    }
}
