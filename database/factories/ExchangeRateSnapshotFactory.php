<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ExchangeRateSnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExchangeRateSnapshot>
 */
final class ExchangeRateSnapshotFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'snapshot_date' => now('UTC')->toDateString(),
            'rates' => [
                'CNY' => ['rate' => 7.2, 'date' => now('UTC')->toDateString()],
                'EUR' => ['rate' => 0.92, 'date' => now('UTC')->toDateString()],
                'IDR' => ['rate' => 16000, 'date' => now('UTC')->toDateString()],
                'MYR' => ['rate' => 4.5, 'date' => now('UTC')->toDateString()],
                'SGD' => ['rate' => 1.35, 'date' => now('UTC')->toDateString()],
            ],
            'retrieved_at' => now('UTC'),
        ];
    }
}
