---
paths:
    - resources/js/hooks/use-calculator.ts
---

# Hooks

## Shared-hosting preview calculation exception

The PHP preview calculator and the browser JavaScript calculator are intentionally separate: PHP serves social crawlers on shared hosting without a persistent Node process, while JavaScript calculates locally without API calls. This is an approved exception to the single-formula rule. Keep formulas, scenario validation, and legacy-link handling aligned, and update cross-language parity tests when calculation behavior changes.
