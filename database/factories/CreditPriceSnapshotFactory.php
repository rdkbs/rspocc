<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\CreditPriceSnapshot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditPriceSnapshot>
 */
final class CreditPriceSnapshotFactory extends Factory
{
    /**
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
            'retrieved_at' => now('UTC'),
        ];
    }
}
