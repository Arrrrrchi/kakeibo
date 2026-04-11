# Linting and Formatting

Do NOT suggest installing `eslint`, `prettier`, `@eslint/*`, or creating `.eslintrc` / `.prettierrc` files.
Do NOT run `next lint` — it is removed in Next.js 16.
This project uses **Biome** for both linting and formatting.

Commands:
- `pnpm lint` — check only
- `pnpm lint:fix` — check + auto-fix
- `pnpm format` — format only

Config is in `biome.json`. Tab indent, semicolons on, line width 100.
