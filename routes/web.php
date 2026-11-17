<?php

declare(strict_types=1);

use App\Http\Controllers\CalculatorController;
use App\Http\Controllers\CalculatorPreviewImageController;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\AcceptHeader;
use Symfony\Component\HttpFoundation\AcceptHeaderItem;

Route::permanentRedirect('/faq', '/id/faq')->name('faq');
Route::permanentRedirect('/terms', '/id/terms')->name('terms');
Route::permanentRedirect('/privacy', '/id/privacy')->name('privacy');

Route::permanentRedirect('/glossary', '/id/glossary')->name('glossary');

Route::get('/{language}/share-preview.png', CalculatorPreviewImageController::class)
    ->whereIn('language', ['id', 'en'])
    ->middleware('throttle:60,1')
    ->name('calculator.preview-image');

Route::get('/{language}/{page}', fn (string $language, string $page): Response => Inertia::render('content', [
    'slug' => $page,
]))
    ->whereIn('language', ['id', 'en'])
    ->whereIn('page', ['faq', 'terms', 'privacy', 'glossary'])
    ->name('localizedContent');

Route::get('/', function (Request $request): RedirectResponse {
    $language = $request->cookie('rspocc_language');
    if (! in_array($language, ['id', 'en'], true)) {
        $languages = array_map(
            static fn (AcceptHeaderItem $item): string => strtolower(explode('-', str_replace('_', '-', $item->getValue()))[0]),
            array_filter(
                AcceptHeader::fromString($request->header('Accept-Language', ''))->all(),
                static fn (AcceptHeaderItem $item): bool => $item->getQuality() > 0,
            ),
        );
        $language = in_array('id', $languages, true) ? 'id' : (in_array('en', $languages, true) ? 'en' : 'id');
    }

    return to_route('calculator.language', [
        'language' => $language,
        ...$request->only('payload'),
    ])->header('Vary', 'Accept-Language, Cookie')
        ->header('Cache-Control', 'private, no-store');
})->name('calculator');

Route::get('/{language}', [CalculatorController::class, 'index'])
    ->whereIn('language', ['id', 'en'])
    ->name('calculator.language');
