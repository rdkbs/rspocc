---
paths:
    - 'app/**'
    - 'routes/**'
    - 'resources/js/**'
    - 'database/**'
    - 'tests/**'
---

# RSPO Credit Calculator

- Before changing UI, layout, or visual styling, read the root `DESIGN.md`; it defines the product's visual direction and accepted color choices.
- Use Wayfinder-generated route helpers when frontend code calls Laravel routes.
- Write PHP tests in Pest. Cover calculation boundaries, rounding, and invalid inputs when calculation behavior is added or changed.
- Keep the current Laravel/Inertia structure; introduce domain modules or extra tooling only when the feature needs them.

## Choose the test runner by language

Use Pest for PHP tests and Bun's built-in test runner for JavaScript tests. Run JavaScript tests through the project's test scripts.

## Displayed number precision

For displayed numbers in calculator results, price references, and social previews, omit zero fractional digits. Values greater than 999999 must display as rounded whole numbers in every currency; values at or below 999999 may retain nonzero decimals within the display's existing precision. Preserve editable input precision and underlying calculation values.

## Plain FAQ wording
Use concise, natural English and Indonesian that older readers can understand without technical knowledge. Explain what the calculator does before why it exists; include comparing estimated additional credit revenue with certification costs for ICS teams. Describe revenue rather than profit because the calculator does not deduct costs.

## Currency support across the calculator
When adding a currency, keep the selector, reference-rate provider, persisted snapshots and fallback handling, shared-scenario validation, PHP previews, and privacy disclosures aligned. Extend relevant API, snapshot, and cross-language calculation tests; preserve existing shared links.

## Calculator runtime separation
Keep interactive calculations in browser JavaScript without per-edit API calls. PHP separately calculates social previews on shared hosting without a persistent Node process; this is the approved exception to single-source calculations. Keep formulas, scenario validation, and legacy-link handling aligned and maintain cross-language parity tests.
