---
paths:
    - app/Services/CalculatorPreview.php
---

# Services

## Displayed number precision

For displayed numbers in calculator results, price references, and social previews, omit zero fractional digits. Show nonzero values below 0.01 with up to four decimal places; show positive values below 0.0001 as `<0.0001` using the selected locale's decimal separator. Values greater than 999999 must display as rounded whole numbers in every currency. Preserve editable input precision and underlying calculation values.

## Shared-hosting preview calculation exception

The PHP preview calculator and the browser JavaScript calculator are intentionally separate: PHP serves social crawlers on shared hosting without a persistent Node process, while JavaScript calculates locally without API calls. This is an approved exception to the single-formula rule. Keep formulas, scenario validation, and legacy-link handling aligned, and update cross-language parity tests when calculation behavior changes.
