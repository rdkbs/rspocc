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
- Keep the public scenario formula in the useCalculator hook, shared by browser rendering and Inertia SSR; do not maintain a separate server formula.
- Use Wayfinder-generated route helpers when frontend code calls Laravel routes.
- Write PHP tests in Pest. Cover calculation boundaries, rounding, and invalid inputs when calculation behavior is added or changed.
- Keep the current Laravel/Inertia structure; introduce domain modules or extra tooling only when the feature needs them.

## Choose the test runner by language

Use Pest for PHP tests and Bun's built-in test runner for JavaScript tests. Run JavaScript tests through the project's test scripts.

## Displayed number precision

For displayed numbers in calculator results, price references, and social previews, omit zero fractional digits. Values greater than 999999 must display as rounded whole numbers in every currency; values at or below 999999 may retain nonzero decimals within the display's existing precision. Preserve editable input precision and underlying calculation values.
