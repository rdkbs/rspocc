<?php

declare(strict_types=1);

use App\Console\Commands\CollectCreditPriceAnalytics;
use App\Console\Commands\RefreshCreditPrices;
use App\Console\Commands\RefreshExchangeRates;
use Illuminate\Support\Facades\Schedule;

Schedule::command(RefreshExchangeRates::class)->dailyAt('17:00')->timezone('UTC')->withoutOverlapping(5);

Schedule::command(RefreshCreditPrices::class)->dailyAt('00:00')->timezone('UTC')->withoutOverlapping(30);
Schedule::command(CollectCreditPriceAnalytics::class)->dailyAt('00:15')->timezone('UTC')->withoutOverlapping(5);
Schedule::command('queue:work database --queue=credit-analytics --stop-when-empty --max-time=45')
    ->everyMinute()
    ->withoutOverlapping(5)
    ->runInBackground();
