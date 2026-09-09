# BazarHub Marketplace

BazarHub is a Bangladesh-focused multi-vendor ecommerce marketplace for discovering products, managing a cart, and placing delivery orders.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm test` — run the Vitest test suite (no external services required; uses an in-process SQLite)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — MySQL connection string (the test suite mocks the DB layer and does not need it)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bazarhub/src/` — React marketplace experience and shopper flows
- `artifacts/api-server/src/routes/marketplace.ts` — catalog, reviews, deals, and order API
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/marketplace.ts` — PostgreSQL marketplace schema and models

## Architecture decisions

- The web app uses the shared API server through `/api`; the frontend should not add a Vite proxy or hardcoded localhost URL.
- Catalog seed data is inserted lazily on the first marketplace API request so a fresh development database is immediately usable.
- Cart state is intentionally persisted in browser storage for the shopper experience; orders are persisted in PostgreSQL.

## Product

Users can browse categories and deals, search and sort products, view product details and reviews, save items to a persistent cart, check out with cash-on-delivery/bKash/Nagad selections, and view recent orders. Seller and admin surfaces are included as foundations for future role-specific operations.

## User preferences & Project Context

- **Live Deployment**: <https://boloban.shop/>
- **Deployment Method**: Uses `./deploy.sh` for FTP deployment directly to cPanel server (bypassing GitHub Actions limits).
- **SPA Apache Routing**: Includes `artifacts/bazarhub/public/.htaccess` to fallback client-side routes (`/admin`, `/seller`, `/cart`) to `index.html`.
- **User Roles & Credentials**:
  - `admin@boloban.local` / `Admin123!` (Role: `admin`)
  - `seller@boloban.local` / `Seller123!` (Role: `seller`)
  - `shopper@boloban.local` / `Shopper123!` (Role: `shopper`)
  - Gated seed endpoint: `POST /api/dev/seed-users?key=$DEV_SEED_KEY`
- **Admin Panel**:
  - Route: `/admin` (Redirected upon logging in as `admin@boloban.local`).
  - Active Plan: Redesigning `/admin` into a multi-tab Admin Management Dashboard (KPIs, Order status updates, Product management, System seeds).

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before changing API consumers.
- Database schema changes require `pnpm --filter @workspace/db run push` in development.
- Always ensure `deploy.sh` builds and copies `.htaccess` to `artifacts/bazarhub/dist/public/.htaccess` before FTP upload.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
