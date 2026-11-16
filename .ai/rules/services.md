---
paths:
    - app/Services/CalculatorPreview.php
---

# Services

## Displayed number precision

For displayed numbers in calculator results, price references, and social previews, omit zero fractional digits. Values greater than 999999 must display as rounded whole numbers in every currency; values at or below 999999 may retain nonzero decimals within the display's existing precision. Preserve editable input precision and underlying calculation values.

## Shared-hosting preview calculation exception

The PHP preview calculator and the browser JavaScript calculator are intentionally separate: PHP serves social crawlers on shared hosting without a persistent Node process, while JavaScript calculates locally without API calls. This is an approved exception to the single-formula rule. Keep formulas, scenario validation, and legacy-link handling aligned, and update cross-language parity tests when calculation behavior changes.
