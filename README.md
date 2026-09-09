# BOLOBAN SHOP

A Bangladesh-focused multi-vendor ecommerce marketplace for discovering products, managing a cart, and placing delivery orders. Browse categories, search and sort products, view product details and reviews, save items to a persistent cart, and check out with cash-on-delivery / bKash / Nagad.

Live at: <https://boloban.shop/>

## Stack

- **Frontend** — React 19, Vite 7, Tailwind CSS 4, TanStack Query, wouter
- **Backend** — Express 5, Node.js 22+ (tested on 22.14 and 24 LTS), TypeScript 5.9
- **Database** — MySQL 8, Drizzle ORM
- **Auth** — Custom: scrypt password hashing + server-side sessions in an httpOnly cookie. No third-party identity provider.
- **Validation** — Zod (generated from OpenAPI)
- **Tooling** — pnpm workspaces, esbuild, Vitest (88 tests), GitHub Actions CI

## Workspace layout

```
artifacts/
  bazarhub/        # React marketplace frontend (@workspace/bazarhub)
  api-server/      # Express API server (@workspace/api-server)
  mockup-sandbox/  # UI component sandbox / mockup preview
lib/
  db/              # Drizzle schema + DB client (@workspace/db)
  api-zod/         # Zod request/response schemas (@workspace/api-zod)
  api-spec/        # OpenAPI source of truth
  api-client-react/# Generated React Query hooks (@workspace/api-client-react)
scripts/           # Workspace scripts (hello, build-sitemap)
.github/workflows/ # CI
```

## Quick start (local)

Requires Node.js **v22+**, pnpm 11, and a MySQL 8 server.

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

The dev server is fully self-contained — no external auth, no service
containers. Sign up a new account at `/sign-up`, or seed the demo
users (see [Demo credentials](#demo-credentials)).

### `start-server.sh` options

```bash
./start-server.sh           # build + start both servers (default)
./start-server.sh --no-build  # skip the esbuild rebuild
./start-server.sh --api     # only the api-server (port 5000)
./start-server.sh --web     # only the bazarhub frontend (port 5173)
```

### Environment variables

**Root `.env`** (for local development):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `mysql://root:root@localhost:3306/bazarhub` | MySQL connection string |
| `PORT` | `5000` | API server port |

**API server (`artifacts/api-server/.env`)**:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `PORT` | Yes | API server port (default 8080 in production) |
| `NODE_ENV` | No | `development` or `production` |
| `DEV_SEED_KEY` | No | Secret for `POST /api/dev/seed-users` endpoint |
| `SESSION_TTL_MS` | No | Session cookie maxAge in ms (default 30 days) |
| `CLERK_DEV_BYPASS` | No | Set to `true` to bypass Clerk auth in dev |

**Frontend (`artifacts/bazarhub/.env`)**:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5173` | Vite dev server port |
| `BASE_PATH` | `/` | Base path for the app |
| `VITE_CLERK_DEV_BYPASS` | `true` | Bypass Clerk auth in dev |

## Auth

Authentication is handled by a small custom layer:

- **Passwords** are hashed with `crypto.scrypt` (Node's built-in, no
  native binding) and stored in `marketplace_users.password_hash`.
- **Sessions** are server-side, stored in `marketplace_sessions` with
  a 30-day TTL. The session id is a 32-byte random token sent to the
  browser as the `boloban_session` httpOnly cookie.
- **API routes** are under `/api/auth/*`:
  - `POST /api/auth/signup` — `{ email, password (≥8), name, phone?, role? }` → 201 + cookie + `{ user }`
  - `POST /api/auth/signin` — `{ email, password }` → 200 + cookie + `{ user }`
  - `POST /api/auth/signout` — 204 + clears cookie
  - `GET  /api/auth/me` — 200 `{ user }` or 401
- **Order linking**: `POST /api/orders` reads `req.user` (populated by
  the `attachUser` middleware) and writes `marketplace_orders.user_id`.
  Anonymous checkout still works; the column is nullable.

## Demo credentials

Three demo users are seeded by `POST /api/dev/seed-users?key=$DEV_SEED_KEY`:

| Email | Password | Role |
|---|---|---|
| `shopper@boloban.local` | `Shopper123!` | shopper |
| `seller@boloban.local` | `Seller123!` | seller |
| `admin@boloban.local`  | `Admin123!`  | admin  |

The seed endpoint is gated by the `DEV_SEED_KEY` env var (set via
cPanel in production). It is idempotent — running it again will mark
existing users as `"exists"` and only create missing ones.

## Scripts

The `scripts/` package contains workspace utilities:

```bash
pnpm --filter @workspace/scripts run hello       # Example script
pnpm --filter @workspace/scripts run build-sitemap  # Generate sitemap.xml for the frontend
```

## Tests

```bash
pnpm test          # 88 tests, ~5 s, no external services
pnpm run typecheck # Full TypeScript check
```

Tests use an in-process SQLite database (a schema mirror of the
production MySQL schema); CI on GitHub Actions runs without any service
containers. The 20 new auth tests cover signup, signin, signout, `/me`,
role-based access, scrypt hashing, expired sessions, and the dev
seed endpoint.

## Deploying

Production deployment is via FTP to a cPanel-style shared host. See
[deployment_instructions.txt](deployment_instructions.txt) and run
[deploy.sh](deploy.sh). The script:

1. Builds the api-server (`esbuild`) and the bazarhub (`vite build`).
2. Uploads the bazarhub static build to the FTP webroot.
3. Uploads the api-server's bundled `dist/` to `api/` on the server.
4. Writes a fresh `api/.env` with the production MySQL credentials.

### `deploy.sh` options (via environment variables)

```bash
# Required (or set in .env):
FTP_HOST=ftp.bengaliislamicinstitute.com
FTP_USER=deploy@boloban.shop
FTP_PASS=deploy@boloban.shop

# Optional:
FTP_PORT=21              # FTP port
FTP_DIR=/                # Remote web root
API_DIR=api              # Remote subdir for the api-server
SKIP_BUILD=0             # Set to 1 to skip rebuilding
SKIP_FRONTEND=0          # Set to 1 to skip the frontend upload
SKIP_API=0               # Set to 1 to skip the api-server upload
```

After the first deploy, log into cPanel → **Setup Node.js App**,
click **RESTART** to start the app, and add the env vars
(`DATABASE_URL`, `PORT`, `NODE_ENV`, `DEV_SEED_KEY`).

## License

[MIT](LICENSE) — © 2026 jarir2020.
