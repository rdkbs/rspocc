<?php

declare(strict_types=1);

use App\Console\Commands\RefreshCreditPrices;
use Illuminate\Support\Facades\Schedule;

Schedule::command(RefreshCreditPrices::class)->dailyAt('01:00')->timezone('UTC')->withoutOverlapping(30);
