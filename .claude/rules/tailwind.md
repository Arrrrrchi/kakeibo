---
paths:
  - "**/*.css"
---

# Tailwind CSS v4

Do NOT create `tailwind.config.js` or `tailwind.config.ts`. Tailwind v4 uses CSS-first configuration.
Do NOT use `@tailwind base`, `@tailwind components`, or `@tailwind utilities` directives.

Correct import: `@import "tailwindcss";`
Custom theme: use `@theme { }` block in CSS.
PostCSS plugin: `@tailwindcss/postcss` (already configured).
