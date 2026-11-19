<?php

declare(strict_types=1);

use App\Console\Commands\RefreshCreditPrices;
use App\Console\Commands\RefreshExchangeRates;
use Illuminate\Support\Facades\Schedule;

Schedule::command(RefreshCreditPrices::class)->dailyAt('00:00')->timezone('UTC')->withoutOverlapping(30);
Schedule::command(RefreshExchangeRates::class)->dailyAt('17:00')->timezone('UTC')->withoutOverlapping(5);
