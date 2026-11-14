<?php

declare(strict_types=1);

use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\ExchangeRateController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

Route::get('/guide', fn (): Response => Inertia::render('content', ['slug' => 'guide']))->name('guide');
Route::get('/faq', fn (): Response => Inertia::render('content', ['slug' => 'faq']))->name('faq');
Route::get('/about', fn (): Response => Inertia::render('content', ['slug' => 'about']))->name('about');
Route::get('/terms', fn (): Response => Inertia::render('content', ['slug' => 'terms']))->name('terms');
Route::get('/privacy', fn (): Response => Inertia::render('content', ['slug' => 'privacy']))->name('privacy');

Route::get('/glossary', fn (): Response => Inertia::render('content', ['slug' => 'glossary']))->name('glossary');

Route::get('/exchange-rates', ExchangeRateController::class)->name('exchange-rates');

Route::get('/{payload?}', [CalculatorController::class, 'index'])->name('calculator');
