---
paths:
    - 'app/**'
    - 'routes/**'
    - 'resources/js/**'
    - 'database/**'
    - 'tests/**'
    - 'config/services.php'
    - 'resources/views/app.blade.php'
---

# RSPO Credit Calculator

- Before changing UI, layout, or visual styling, read the root `DESIGN.md`; it defines the product's visual direction, accepted colors, and control placement.
- Use Wayfinder-generated route helpers when frontend code calls Laravel routes.
- Write PHP tests in Pest. Cover calculation boundaries, rounding, and invalid inputs when calculation behavior is added or changed.
- Keep the current Laravel/Inertia structure; introduce domain modules or extra tooling only when the feature needs them.

## Choose the test runner by language

Use Pest for PHP tests and Bun's built-in test runner for JavaScript tests. Run JavaScript tests through the project's test scripts.

## Displayed number precision

For displayed numbers in calculator results, price references, and social previews, omit zero fractional digits. Show nonzero values below 0.01 with up to four decimal places; show positive values below 0.0001 as `<0.0001` using the selected locale's decimal separator. Values greater than 999999 must display as rounded whole numbers in every currency. Preserve editable input precision and underlying calculation values.

## Plain FAQ wording

Use concise, natural English and Indonesian that older readers can understand without technical knowledge. Explain what the calculator does before why it exists; include comparing estimated additional credit revenue with certification costs for ICS teams. Describe revenue rather than profit because the calculator does not deduct costs.

## Currency support across the calculator

When adding a currency, keep the selector, reference-rate provider, persisted snapshots and fallback handling, shared-scenario validation, PHP previews, and privacy disclosures aligned. Extend relevant API, snapshot, and cross-language calculation tests; preserve existing shared links.

## Calculator runtime separation

Keep interactive calculations in browser JavaScript without per-edit API calls. PHP separately calculates social previews on shared hosting without a persistent Node process; this is the approved exception to single-source calculations. Keep formulas, scenario validation, and legacy-link handling aligned and maintain cross-language parity tests.

## Language and currency preference priority

Keep explicit /id and /en URLs authoritative, and preserve shared or history-restored calculation currencies and rates. Use saved manual choices before browser preferences for fresh defaults; prefer supported non-English preferences, without guessing from ambiguous language-only tags. Detect language only at / using a temporary, non-shared-cacheable redirect; ignore Accept-Language entries with q=0. Remember manual language choices in the first-party language cookie and currency choices in local storage, and keep privacy disclosures aligned.

## Database-backed exchange rates in page props

Pass the latest database exchange-rate snapshot to the calculator through Inertia props. Store PRISMA prices and Frankfurter rates in separate snapshot tables and refresh them through separate scheduled commands; run the exchange-rate refresh after its source publishes. Do not fetch rates through a browser API, during page rendering, or from a file-cache fallback. Preserve shared/manual rates and the existing rate when detected currency is unchanged; when no reference rate is available, retain the existing IDR default and allow manual entry.

Store timestamps and analytics intervals in UTC. Format PRISMA retrieval timestamps in the viewer's browser timezone. Keep Frankfurter's source-provided date-only rate dates unchanged.

## PRISMA credit analytics

Keep historical PRISMA retrievals separate from calculator price snapshots. Follow `docs/adr/0001-separate-credit-price-analytics.md` for collection, interval splitting, reconciliation, queue retries, and audit provenance.

## Analytics and calculation privacy

Load Google Tag Manager only in production and send manual page views with `payload` removed from page URLs and referrers. Keep `referrerpolicy="no-referrer"` on its script, disable automatic and history-based page views in the GTM configuration, and keep English and Indonesian privacy disclosures aligned with collected data. Cover URL sanitization with a Bun test.

## Canonical URLs in the bilingual sitemap

Keep `/sitemap.xml` in sync when public search pages or their localized routes change. Generate canonical URLs from `APP_URL` and named routes, and link both Indonesian and English variants with reciprocal `hreflang` entries. Exclude redirect URLs, shared calculation payloads, filtered URLs, and export endpoints.
