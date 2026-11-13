---
paths:
    - 'app/**'
    - 'routes/**'
    - 'resources/js/**'
    - 'database/**'
    - 'tests/**'
---

# RSPO Credit Calculator

- Keep credit calculations authoritative on the server; the frontend collects inputs and presents server results.
- Use Wayfinder-generated route helpers when frontend code calls Laravel routes.
- Write tests in Pest. Cover calculation boundaries, rounding, and invalid inputs when calculation behavior is added or changed.
- Keep the current Laravel/Inertia structure; introduce domain modules or extra tooling only when the feature needs them.
