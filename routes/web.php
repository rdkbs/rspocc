<?php

declare(strict_types=1);

use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\ExchangeRateController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

Route::permanentRedirect('/faq', '/id/faq')->name('faq');
Route::permanentRedirect('/terms', '/id/terms')->name('terms');
Route::permanentRedirect('/privacy', '/id/privacy')->name('privacy');

Route::permanentRedirect('/glossary', '/id/glossary')->name('glossary');

Route::get('/exchange-rates', ExchangeRateController::class)->name('exchange-rates');

Route::get('/{language}/{page}', fn (string $language, string $page): Response => Inertia::render('content', [
    'slug' => $page,
]))
    ->whereIn('language', ['id', 'en'])
    ->whereIn('page', ['faq', 'terms', 'privacy', 'glossary'])
    ->name('localizedContent');

Route::get('/', fn (Request $request) => to_route('calculator.language', [
    'language' => 'id',
    ...$request->only('payload'),
], 301))->name('calculator');

Route::get('/{language}', [CalculatorController::class, 'index'])
    ->whereIn('language', ['id', 'en'])
    ->name('calculator.language');
