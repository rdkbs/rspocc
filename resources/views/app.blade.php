@php
    $language = $page['props']['lang'] ?? 'id';
    $slug = $page['component'] === 'content'
        ? ($page['props']['slug'] ?? 'faq')
        : 'index';
    $fallbackPages = [
        'en' => [
            'index' => [
                'title' => 'Estimate RSPO credit revenue',
                'description' => 'Enter FFB volume and credit prices to estimate premium revenue and added value per kilogram.',
                'steps' => ['Enter FFB volume', 'Add credit prices', 'Review your estimate'],
            ],
            'faq' => ['title' => 'Frequently Asked Questions', 'description' => 'Answers about this calculator, credit prices, and exchange rates.'],
            'glossary' => ['title' => 'Glossary', 'description' => 'Definitions of terms used in the RSPO credit calculator.'],
            'terms' => ['title' => 'Terms of Service', 'description' => 'Calculator results are estimates, not contracts or binding offers.'],
            'privacy' => ['title' => 'Privacy Policy', 'description' => 'Learn how the calculator handles your inputs and shared links.'],
        ],
        'id' => [
            'index' => [
                'title' => 'Perkirakan pendapatan kredit RSPO',
                'description' => 'Masukkan volume TBS dan harga kredit untuk memperkirakan pendapatan serta nilai tambah per kilogram.',
                'steps' => ['Masukkan volume TBS', 'Isi harga kredit', 'Lihat perkiraan'],
            ],
            'faq' => ['title' => 'Pertanyaan Umum', 'description' => 'Jawaban tentang kalkulator, harga kredit, dan nilai tukar.'],
            'glossary' => ['title' => 'Glosarium', 'description' => 'Arti istilah yang digunakan dalam kalkulator kredit RSPO.'],
            'terms' => ['title' => 'Ketentuan Penggunaan', 'description' => 'Hasil kalkulator adalah perkiraan, bukan kontrak atau penawaran yang mengikat.'],
            'privacy' => ['title' => 'Kebijakan Privasi', 'description' => 'Cara kalkulator menangani data perhitungan dan tautan yang dibagikan.'],
        ],
    ];
    $fallback = $fallbackPages[$language][$slug] ?? $fallbackPages['id']['index'];
    $productName = $language === 'id' ? 'Kalkulator Kredit RSPO' : 'RSPO Credit Calculator';
    $canonicalUrl = $slug === 'index'
        ? route('calculator.language', ['language' => $language])
        : route('localizedContent', ['language' => $language, 'page' => $slug]);
@endphp
<!DOCTYPE html>
<html data-type="software" lang="{{ $language }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="light dark">

        <link rel="icon" href="/logo-white-green.svg" type="image/svg+xml" sizes="any">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $fallback['title'] }} - RSPO Credit Calculator</title>
            <meta name="description" content="{{ $fallback['description'] }}">
            <link rel="canonical" href="{{ $canonicalUrl }}">
            <meta property="og:title" content="{{ $fallback['title'] }}">
            <meta property="og:description" content="{{ $fallback['description'] }}">
            <meta property="og:type" content="website">
            <meta property="og:url" content="{{ $canonicalUrl }}">
        </x-inertia::head>
        <style>
            #app:not(:empty) + #initial-page-fallback { display: none; }
            #initial-page-fallback {
                box-sizing: border-box;
                min-height: 100vh;
                padding: 24px max(20px, calc((100vw - 1120px) / 2));
                background: #f6f6ef;
                color: #252c25;
                font: 400 18px/1.6 system-ui, sans-serif;
            }
            body { margin: 0; }
            #initial-page-fallback * { box-sizing: border-box; }
            #initial-page-fallback a { color: #9c5000; }
            #initial-page-fallback header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e1e3d9;
            }
            #initial-page-fallback .brand {
                display: grid;
                min-height: 44px;
                color: #252c25;
                text-decoration: none;
                line-height: 1.3;
            }
            #initial-page-fallback .brand strong { color: #9c5000; }
            #initial-page-fallback .brand span { font-size: 14px; color: #62685e; }
            #initial-page-fallback nav { display: flex; flex-wrap: wrap; gap: 8px 20px; }
            #initial-page-fallback nav a {
                display: inline-flex;
                min-height: 44px;
                align-items: center;
                font-size: 16px;
                font-weight: 600;
                text-underline-offset: 4px;
            }
            #initial-page-fallback main { max-width: 820px; margin: clamp(48px, 12vh, 112px) auto; }
            #initial-page-fallback h1 {
                margin: 0 0 16px;
                color: #9c5000;
                font-size: clamp(36px, 7vw, 64px);
                font-weight: 600;
                letter-spacing: -0.04em;
                line-height: 1.1;
            }
            #initial-page-fallback p { max-width: 680px; margin: 0; color: #52594d; }
            #initial-page-fallback ol {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 24px;
                margin: 48px 0 0;
                padding: 0;
                list-style-position: inside;
            }
            #initial-page-fallback li { padding-top: 12px; border-top: 2px solid #e17e00; }
            #initial-page-fallback footer { padding-top: 20px; border-top: 1px solid #e1e3d9; font-size: 14px; }
            #initial-page-fallback footer a { display: inline-flex; min-height: 44px; align-items: center; color: #52594d; }
            html.dark #initial-page-fallback { background: #121212; color: #f2f1eb; }
            html.dark #initial-page-fallback .brand { color: #f2f1eb; }
            html.dark #initial-page-fallback .brand span,
            html.dark #initial-page-fallback p { color: #bebfb6; }
            html.dark #initial-page-fallback a,
            html.dark #initial-page-fallback h1,
            html.dark #initial-page-fallback .brand strong { color: #ffc27d; }
            @media (max-width: 640px) {
                #initial-page-fallback header { align-items: flex-start; flex-direction: column; gap: 12px; }
                #initial-page-fallback nav { gap: 4px 16px; }
                #initial-page-fallback ol { grid-template-columns: 1fr; gap: 16px; margin-top: 32px; }
            }
        </style>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
        <div id="initial-page-fallback" lang="{{ $language }}">
            <header>
                <a class="brand" href="{{ route('calculator.language', ['language' => $language]) }}">
                    <strong>{{ $productName }}</strong>
                    <span>{{ $language === 'id' ? 'oleh Belayan Sejahtera' : 'by Belayan Sejahtera' }}</span>
                </a>
                <nav aria-label="{{ $language === 'id' ? 'Navigasi utama' : 'Main navigation' }}">
                    @foreach (['faq' => ['FAQ', 'FAQ'], 'glossary' => ['Glosarium', 'Glossary'], 'terms' => ['Ketentuan', 'Terms'], 'privacy' => ['Privasi', 'Privacy']] as $pageSlug => [$indonesianLabel, $englishLabel])
                        <a href="{{ route('localizedContent', ['language' => $language, 'page' => $pageSlug]) }}">{{ $language === 'id' ? $indonesianLabel : $englishLabel }}</a>
                    @endforeach
                </nav>
            </header>
            <main>
                <h1>{{ $fallback['title'] }}</h1>
                <p>{{ $fallback['description'] }}</p>
                @if (isset($fallback['steps']))
                    <ol>
                        @foreach ($fallback['steps'] as $step)
                            <li>{{ $step }}</li>
                        @endforeach
                    </ol>
                @endif
            </main>
            <footer>
                <a href="https://belayansejahtera.org">Koperasi Perkebunan Belayan Sejahtera</a>
            </footer>
        </div>
    </body>
</html>
