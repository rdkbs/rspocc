@php
    $language = $page['props']['lang'] ?? 'id';
    $colorScheme = $page['props']['colorScheme'] ?? 'light';
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
    $sharePreview = $page['props']['sharePreview'] ?? null;
    $previewImageUrl = $page['props']['previewImageUrl'] ?? null;
    $socialTitle = $sharePreview['title'] ?? $fallback['title'];
    $socialDescription = $sharePreview['description'] ?? $fallback['description'];
    $productName = $language === 'id' ? 'Kalkulator Kredit RSPO' : 'RSPO Credit Calculator';
    $canonicalPath = $slug === 'index'
        ? route('calculator.language', ['language' => $language], absolute: false)
        : route('localizedContent', ['language' => $language, 'page' => $slug], absolute: false);
    $canonicalUrl = rtrim(config('app.url'), '/').$canonicalPath;
    $shareUrl = $canonicalUrl;
    if ($sharePreview !== null) {
        $shareUrl .= '?'.http_build_query(['payload' => $page['props']['payload']], '', '&', PHP_QUERY_RFC3986);
    }
@endphp
<!DOCTYPE html>
<html data-type="software" lang="{{ $language }}" @class(['dark' => $colorScheme === 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="color-scheme" content="{{ $colorScheme }}">
        @if (! config('inertia.ssr.enabled'))
            <script>
                document.documentElement.classList.add('js');
                try {
                    const colorScheme = localStorage.getItem('rspocc:color-scheme');
                    if (colorScheme === 'dark' || colorScheme === 'light') {
                        document.documentElement.classList.toggle('dark', colorScheme === 'dark');
                        const meta = document.querySelector('meta[name="color-scheme"]');
                        if (meta) {
                            meta.content = colorScheme;
                        }
                    }
                } catch {}
            </script>
        @endif

        <link rel="icon" href="/logo.svg" type="image/svg+xml" sizes="any">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @if (app()->environment('production') && filled(config('services.google.tag_manager_id')))
            <script>
                window.dataLayer = window.dataLayer || [];
                window.gtag = function () { window.dataLayer.push(arguments); };
                window.gtag('js', new Date());
                window.gtag('set', {
                    page_location: (() => {
                        const url = new URL(window.location.href);
                        url.searchParams.delete('payload');
                        return url.href;
                    })(),
                    page_referrer: (() => {
                        if (!document.referrer) return '';
                        const url = new URL(document.referrer);
                        url.searchParams.delete('payload');
                        return url.href;
                    })(),
                });
            </script>
            <script async src="https://www.googletagmanager.com/gtm.js?id={{ urlencode(config('services.google.tag_manager_id')) }}" referrerpolicy="no-referrer"></script>
        @endif

        @fonts

        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $fallback['title'] }} - RSPO Credit Calculator</title>
            <meta name="description" content="{{ $fallback['description'] }}">
            <link rel="canonical" href="{{ $canonicalUrl }}">
            <meta property="og:title" content="{{ $socialTitle }}">
            <meta property="og:description" content="{{ $socialDescription }}">
            <meta property="og:type" content="website">
            <meta property="og:url" content="{{ $shareUrl }}">
            @if ($previewImageUrl)
                <meta property="og:image" content="{{ $previewImageUrl }}">
                <meta property="og:image:type" content="image/png">
                <meta property="og:image:width" content="1200">
                <meta property="og:image:height" content="630">
                <meta property="og:image:alt" content="{{ $socialTitle }}">
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:image" content="{{ $previewImageUrl }}">
            @else
                <meta name="twitter:card" content="summary">
            @endif
            <meta name="twitter:title" content="{{ $socialTitle }}">
            <meta name="twitter:description" content="{{ $socialDescription }}">
        </x-inertia::head>
        <style>
            html { background: #f6f6ef; color-scheme: light; }
            html.dark { background: #121212; color-scheme: dark; }
            #app-loading { display: none; }
            .js #app-loading { display: block; }
            #app:not(:empty) + #app-loading { display: none; }
            #app-loading {
                box-sizing: border-box;
                min-height: 100vh;
                padding: 0;
                font: 400 16px/1.5 "Instrument Sans", Arial, sans-serif;
                color: #62685e;
            }
            #app-loading .loading-header {
                box-sizing: border-box;
                min-height: 95px;
                display: flex;
                align-items: center;
                padding: 16px max(16px, calc((100vw - 1200px) / 2));
                background: #ffffff;
                border-bottom: 1px solid #e1e3d9;
            }
            #app-loading .loading-grid {
                display: grid;
                gap: 24px;
                margin: 48px max(16px, calc((100vw - 1200px) / 2));
            }
            .fallback-brand { display: inline-flex; gap: 12px; align-items: center; text-decoration: none; color: inherit; }
            .fallback-brand img { width: 44px; height: 44px; border-radius: 12%; }
            .fallback-brand strong { display: block; font-size: 13px; color: #e17e00; line-height: 1.5; }
            .fallback-brand small { display: block; font-size: 15.4286px; line-height: 1; }
            @media (min-width: 600px) {
                .fallback-brand strong { font-size: 20.5712px; }
            }
            html.dark #app-loading .loading-header { background: #1d201c; }
            #app-loading .loading-content { margin: 48px max(16px, calc((100vw - 1200px) / 2)); }
            #app-loading .loading-content .loading-grid { margin: 0; }
            #app-loading .loading-content-title { max-width: 240px; }
            #app-loading .loading-content .loading-copy { height: 72px; }
            @media (min-width: 600px) {
                #app-loading .loading-guide { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            @media (min-width: 900px) {
                #app-loading .loading-faq { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            }
            #app-loading .loading-panel { padding: 24px; border: 1px solid #e1e3d9; border-radius: 12px; }
            #app-loading .loading-line { height: 24px; background: #e1e3d9; border-radius: 6px; margin-bottom: 24px; }
            #app-loading .loading-line:last-child { margin-bottom: 0; }
            #app-loading .loading-field { height: 56px; }
            #app-loading .loading-result { height: 96px; }
            html.dark #app-loading { color: #bebfb6; }
            html.dark #app-loading .loading-header,
            html.dark #app-loading .loading-panel { border-color: #353535; }
            html.dark #app-loading .loading-line { background: #292929; }
            @media (min-width: 900px) {
                #app-loading .loading-grid.calculator { grid-template-columns: 1fr 1fr; }
            }
            #initial-page-fallback {
                box-sizing: border-box;
                min-height: 100vh;
                padding: 0;
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
                min-height: 95px;
                padding: 16px max(16px, calc((100vw - 1200px) / 2));
                background: #ffffff;
                border-bottom: 1px solid #e1e3d9;
            }
            #initial-page-fallback .brand {
                display: flex;
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
            html.dark #initial-page-fallback header { background: #1d201c; }
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
        <div id="app-loading" role="status" aria-label="{{ $language === 'id' ? 'Memuat halaman' : 'Loading page' }}">
            <div aria-hidden="true">
                <div class="loading-header">
                    <div class="fallback-brand">
                        <img src="/logo.svg" alt="" width="44" height="44">
                        <div>
                            <strong>{{ $productName }}</strong>
                            <small>{{ $language === 'id' ? 'oleh Belayan Sejahtera' : 'by Belayan Sejahtera' }}</small>
                        </div>
                    </div>
                </div>
                <div @class(['loading-grid', 'calculator' => $slug === 'index'])>
                    <div class="loading-panel">
                        <div class="loading-line"></div>
                        <div class="loading-line loading-field"></div>
                        <div class="loading-line loading-field"></div>
                        <div class="loading-line loading-field"></div>
                        <div class="loading-line loading-field"></div>
                    </div>
                    @if ($slug === 'index')
                        <div class="loading-panel">
                            <div class="loading-line"></div>
                            <div class="loading-line loading-result"></div>
                            <div class="loading-line"></div>
                        </div>
                    @endif
                </div>
                @if ($slug === 'index')
                    @foreach (['guide', 'faq'] as $loadingSection)
                        <div class="loading-content">
                            <div class="loading-line loading-content-title"></div>
                            <div class="loading-grid loading-{{ $loadingSection }}">
                                @for ($item = 0; $item < 3; $item++)
                                    <div>
                                        <div class="loading-line"></div>
                                        <div class="loading-line loading-copy"></div>
                                    </div>
                                @endfor
                            </div>
                        </div>
                    @endforeach
                @endif
            </div>
        </div>
        <noscript>
        <div id="initial-page-fallback" lang="{{ $language }}">
            <header>
                <a class="brand fallback-brand" href="{{ route('calculator.language', ['language' => $language]) }}">
                    <img src="/logo.svg" alt="" width="44" height="44">
                    <div>
                    <strong>{{ $productName }}</strong>
                    <span>{{ $language === 'id' ? 'oleh Belayan Sejahtera' : 'by Belayan Sejahtera' }}</span>
                    </div>
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
        </noscript>
    </body>
</html>
