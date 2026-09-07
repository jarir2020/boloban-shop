# BOLOBAN SHOP

A Bangladesh-focused multi-vendor ecommerce marketplace for discovering products, managing a cart, and placing delivery orders. Browse categories, search and sort products, view product details and reviews, save items to a persistent cart, and check out with cash-on-delivery / bKash / Nagad.

Live at: <https://bengaliislamicinstitute.com/boloban-shop/> (after first deploy).

## Stack

- **Frontend** — React 19, Vite 7, Tailwind CSS 4, TanStack Query, wouter
- **Backend** — Express 5, Node.js 24, TypeScript 5.9
- **Database** — MySQL 8, Drizzle ORM
- **Validation** — Zod (generated from OpenAPI)
- **Tooling** — pnpm workspaces, esbuild, Vitest (67 tests), GitHub Actions CI

## Workspace layout

```
artifacts/
  bazarhub/        # React marketplace frontend
  api-server/      # Express API server
  mockup-sandbox/  # Misc
lib/
  db/              # Drizzle schema + DB client (@workspace/db)
  api-zod/         # Zod request/response schemas (@workspace/api-zod)
  api-spec/        # OpenAPI source of truth
  api-client-react/# Generated React hooks (@workspace/api-client-react)
scripts/           # Workspace scripts
.github/workflows/ # CI
```

## Quick start (local)

Requires Node.js **v24** (LTS), pnpm 11, and a MySQL 8 server.

```bash
# 1. Install
pnpm install

# 2. Create the database & push the schema
mysql -h localhost -u root -p -e "CREATE DATABASE IF NOT EXISTS bazarhub CHARACTER SET utf8mb4;"
DATABASE_URL='mysql://root:root@localhost:3306/bazarhub' \
  pnpm --filter @workspace/db run push

# 3. Start the api-server (port 5000) and the Vite dev server (port 5173)
./start-server.sh

# 4. Visit http://localhost:5173
```

The dev server uses a `CLERK_DEV_BYPASS=true` flag to skip Clerk auth — the
api-server and frontend both honor it locally. See [replit.md](replit.md) for
the original Replit-targeted setup.

## Tests

```bash
pnpm test          # 67 tests, ~3 s, no external services
pnpm run typecheck # Full TypeScript check
```

Tests use an in-process SQLite database; CI on GitHub Actions runs without
any service containers.

## Deploying

Production deployment is via FTP to a cPanel-style shared host. See
[deployment_instructions.txt](deployment_instructions.txt) and run
[deploy.sh](deploy.sh). The script:

1. Builds the api-server (`esbuild`) and the bazarhub (`vite build`).
2. Uploads the bazarhub static build to the FTP webroot.
3. Uploads the api-server's bundled `dist/` to `api/` on the server.
4. Writes a fresh `api/.env` with the production MySQL credentials.

## License

[MIT](LICENSE) — © 2026 jarir2020.
