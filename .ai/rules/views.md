---
paths:
  - 'resources/views/**'
---

# Views

## Shared-hosting initial rendering
Keep SSR optional for shared hosting. Render SEO and social metadata in Blade. Show branded loading skeletons immediately until React mounts, including index guide and FAQ placeholders; match the frontend header's logo, localized app name, owner, spacing, and theme. Keep the text fallback inside noscript and apply the saved theme before the first paint.
