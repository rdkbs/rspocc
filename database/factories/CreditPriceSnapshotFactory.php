<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CreditPriceSnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditPriceSnapshot>
 */
class CreditPriceSnapshotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'period_start' => now('UTC')->startOfYear()->toDateString(),
            'period_end' => now('UTC')->toDateString(),
            'prices' => [
                'standard' => ['cspo' => 1.0, 'cspko' => 1.0, 'cspke' => 1.0],
                'is' => ['cspo' => 1.0, 'cspko' => 1.0, 'cspke' => 1.0],
            ],
            'exchange_rates' => [
                'IDR' => ['rate' => 16000, 'date' => now('UTC')->toDateString()],
                'MYR' => ['rate' => 4.5, 'date' => now('UTC')->toDateString()],
                'CNY' => ['rate' => 7.2, 'date' => now('UTC')->toDateString()],
                'EUR' => ['rate' => 0.92, 'date' => now('UTC')->toDateString()],
            ],
            'retrieved_at' => now('UTC'),
        ];
    }
}
