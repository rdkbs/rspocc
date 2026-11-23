@php
    $baseUrl = rtrim(config('app.url'), '/');
    $languages = ['id', 'en'];
    $pages = [
        ['calculator.language', []],
        ['trends.index', []],
        ['localizedContent', ['page' => 'faq']],
        ['localizedContent', ['page' => 'glossary']],
    ];
@endphp
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    @foreach ($pages as [$routeName, $parameters])
        @php
            $urls = [];
            foreach ($languages as $language) {
                $urls[$language] = $baseUrl.route($routeName, ['language' => $language, ...$parameters], false);
            }
        @endphp
        @foreach ($urls as $url)
            <url>
                <loc>{{ $url }}</loc>
                @foreach ($urls as $language => $alternateUrl)
                    <xhtml:link rel="alternate" hreflang="{{ $language }}" href="{{ $alternateUrl }}" />
                @endforeach
            </url>
        @endforeach
    @endforeach
</urlset>
