---
paths:
    - 'app/**'
    - 'routes/**'
    - 'resources/js/**'
    - 'database/**'
    - 'tests/**'
---

# RSPO Credit Calculator

- Keep the public scenario formula in the useCalculator hook, shared by browser rendering and Inertia SSR; do not maintain a separate server formula.
- Use Wayfinder-generated route helpers when frontend code calls Laravel routes.
- Write PHP tests in Pest. Cover calculation boundaries, rounding, and invalid inputs when calculation behavior is added or changed.
- Keep the current Laravel/Inertia structure; introduce domain modules or extra tooling only when the feature needs them.

## Choose the test runner by language

Use Pest for PHP tests and Bun's built-in test runner for JavaScript tests. Run JavaScript tests through the project's test scripts.
