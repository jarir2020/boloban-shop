#!/usr/bin/env bash
# ============================================================================
#  BolobanShop — Local Deployment Script
#  Builds the api-server (esbuild) and the bazarhub frontend (Vite) and
#  uploads the artifacts to the shared host via FTP. The api-server's
#  bundled `dist/` is a self-contained Node.js app — no `npm install` is
#  required on the server.
# ============================================================================
#
#  Configuration: put the FTP creds and any overrides in `.env` next to
#  this script (the file is .gitignored). All variables are optional
#  except FTP_HOST/FTP_USER/FTP_PASS.
#
#    FTP_HOST=ftp.bengaliislamicinstitute.com
#    FTP_USER=deploy@boloban.shop
#    FTP_PASS=deploy@boloban.shop
#    FTP_PORT=21
#    FTP_DIR=/                  # remote web root
#    API_DIR=api                # remote subdir for the api-server
#    SKIP_BUILD=0               # set to 1 to skip rebuilding
#    SKIP_FRONTEND=0            # set to 1 to skip the frontend upload
#    SKIP_API=0                 # set to 1 to skip the api-server upload
# ============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors (only if attached to a tty).
if [ -t 1 ]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
  BLUE=$'\033[0;34m'; NC=$'\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; NC=''
fi

# Load .env (if present).
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
  set +a
fi

FTP_HOST="${FTP_HOST:-ftp.bengaliislamicinstitute.com}"
FTP_PORT="${FTP_PORT:-21}"
FTP_USER="${FTP_USER:-deploy@boloban.shop}"
FTP_PASS="${FTP_PASS:-deploy@boloban.shop}"
FTP_DIR="${FTP_DIR:-/}"
API_DIR="${API_DIR:-api}"
SKIP_BUILD="${SKIP_BUILD:-0}"
SKIP_FRONTEND="${SKIP_FRONTEND:-0}"
SKIP_API="${SKIP_API:-0}"

# ---------------------------------------------------------------------------
# Sanity checks
# ---------------------------------------------------------------------------

if [ -z "$FTP_HOST" ] || [ -z "$FTP_USER" ] || [ -z "$FTP_PASS" ]; then
  echo "${RED}❌ FTP config missing${NC}"
  echo "Set FTP_HOST, FTP_USER, FTP_PASS in .env (or in the environment)."
  exit 1
fi

if ! command -v lftp >/dev/null 2>&1; then
  echo "${RED}❌ lftp is not installed${NC}"
  echo "Install with: sudo apt-get install lftp"
  exit 1
fi

NODE_VERSION="$(node --version 2>/dev/null || echo 'not found')"

echo "${BLUE}============================================================${NC}"
echo "${BLUE}  BOLOBAN SHOP — Deployment${NC}"
echo "${BLUE}============================================================${NC}"
echo ""
echo "  Time:    $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "  Server:  $FTP_HOST:$FTP_PORT"
echo "  Webroot: $FTP_DIR"
echo "  API dir: $FTP_DIR$API_DIR/"
echo "  Node:    $NODE_VERSION  (the server needs Node v22+; works on 22.14 and 24 LTS)"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Build api-server
# ---------------------------------------------------------------------------

if [ "$SKIP_BUILD" != "1" ]; then
  echo "${YELLOW}▶ Step 1: Building the api-server (esbuild)…${NC}"
  if [ ! -d "$SCRIPT_DIR/artifacts/api-server/node_modules" ]; then
    echo "${YELLOW}  ⚠ artifacts/api-server/node_modules is missing — running pnpm install at the workspace root first${NC}"
    pnpm install --frozen-lockfile
  fi
  ( cd "$SCRIPT_DIR/artifacts/api-server" && node ./build.mjs )
  echo "${GREEN}  ✅ api-server built${NC}"
  echo ""

  echo "${YELLOW}▶ Step 2: Building the bazarhub frontend (Vite)…${NC}"
  if [ ! -d "$SCRIPT_DIR/artifacts/bazarhub/node_modules" ]; then
    echo "${RED}  ❌ artifacts/bazarhub/node_modules is missing — run pnpm install at the workspace root${NC}"
    exit 1
  fi
  ( cd "$SCRIPT_DIR/artifacts/bazarhub" && \
    PORT=4173 BASE_PATH=/ \
      ./node_modules/.bin/vite build --config vite.config.ts )
  echo "${GREEN}  ✅ bazarhub built${NC}"
  echo ""

  echo "${YELLOW}▶ Step 2b: Generating sitemap.xml…${NC}"
  ( cd "$SCRIPT_DIR/scripts" && ./node_modules/.bin/tsx ./src/build-sitemap.ts )
  echo "${GREEN}  ✅ sitemap built${NC}"
  echo ""
else
  echo "${YELLOW}▶ Step 1+2: Skipping build (SKIP_BUILD=1)${NC}"
  echo ""
fi

# ---------------------------------------------------------------------------
# Verify the artifacts exist
# ---------------------------------------------------------------------------

API_DIST="$SCRIPT_DIR/artifacts/api-server/dist"
WEB_DIST="$SCRIPT_DIR/artifacts/bazarhub/dist/public"

if [ "$SKIP_API" != "1" ] && [ ! -f "$API_DIST/index.mjs" ]; then
  echo "${RED}❌ $API_DIST/index.mjs is missing — did the build succeed?${NC}"
  exit 1
fi
if [ "$SKIP_FRONTEND" != "1" ] && [ ! -f "$WEB_DIST/index.html" ]; then
  echo "${RED}❌ $WEB_DIST/index.html is missing — did the Vite build succeed?${NC}"
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 3: Stage the api-server tree (api/package.json + .env + dist/)
# ---------------------------------------------------------------------------

API_STAGE="$(mktemp -d -t boloban-api-XXXXXX)"
trap 'rm -rf "$API_STAGE"' EXIT

if [ "$SKIP_API" != "1" ]; then
  echo "${YELLOW}▶ Step 3: Staging api-server tree…${NC}"
  mkdir -p "$API_STAGE/$API_DIR"
  cp -a "$API_DIST/." "$API_STAGE/$API_DIR/"
  # cPanel's "Setup Node.js App" looks for a package.json in the app root
  # and reads the "start" script to know how to run it.
  cat > "$API_STAGE/$API_DIR/package.json" <<'JSON'
{
  "name": "boloban-shop-api",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.0.0"
  },
  "scripts": {
    "start": "node --enable-source-maps index.mjs"
  }
}
JSON
  if [ -f "$SCRIPT_DIR/artifacts/api-server/.env.production.example" ]; then
    cp "$SCRIPT_DIR/artifacts/api-server/.env.production.example" \
       "$API_STAGE/$API_DIR/.env"
  fi
  echo "${GREEN}  ✅ staged $(du -sh "$API_STAGE/$API_DIR" | cut -f1) at $API_STAGE/$API_DIR${NC}"
  echo ""
fi

# ---------------------------------------------------------------------------
# Step 4: Upload via FTP (lftp)
# ---------------------------------------------------------------------------

LFTP_SCRIPT="$(mktemp -t deploy-XXXXXX.lftp)"
trap 'rm -rf "$API_STAGE"; rm -f "$LFTP_SCRIPT"' EXIT

cat > "$LFTP_SCRIPT" <<LFTP_EOF
set ftp:ssl-allow no
set ssl:verify-certificate no
set net:timeout 30
set net:max-retries 2
set ftp:passive-mode yes

open ftp://$FTP_USER:$FTP_PASS@$FTP_HOST:$FTP_PORT

# Sanity: list the root so we know auth worked.
ls $FTP_DIR
LFTP_EOF

if [ "$SKIP_FRONTEND" != "1" ]; then
  cat >> "$LFTP_SCRIPT" <<LFTP_EOF

# ---- Frontend: mirror bazarhub/dist/public/ into the web root.
# No --delete: the FTP root has unrelated files (cgi-bin, .well-known,
# test.php) that we must not touch.
cd $FTP_DIR
mirror --reverse --verbose --no-perms --only-newer --parallel=2 \
  --exclude-glob '.env' \
  --exclude-glob '.env.*' \
  --exclude-glob '.ftpquota' \
  $WEB_DIST/ ./
LFTP_EOF
fi

if [ "$SKIP_API" != "1" ]; then
  cat >> "$LFTP_SCRIPT" <<LFTP_EOF

# ---- API server: upload the staged tree into FTP_DIR/api/.
cd $FTP_DIR
mkdir -p $API_DIR
mirror --reverse --verbose --no-perms --only-newer --parallel=2 \
  --exclude-glob '.env' \
  --exclude-glob '.env.*' \
  $API_STAGE/$API_DIR/ $API_DIR/

# Write a fresh .env on the server (overwrites any previous).  lftp's
# `put -O <dir> <local>` syntax differs across versions, so we cd into
# the target dir and use the local-path form which is reliable.
cd $FTP_DIR$API_DIR
put $API_STAGE/$API_DIR/.env -o .env
LFTP_EOF
fi

cat >> "$LFTP_SCRIPT" <<'LFTP_EOF'

quit
LFTP_EOF

echo "${YELLOW}▶ Step 4: Uploading to $FTP_HOST…${NC}"
echo ""
lftp -f "$LFTP_SCRIPT"
echo ""
echo "${GREEN}  ✅ upload complete${NC}"
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo "${BLUE}============================================================${NC}"
echo "${GREEN}  ✅ Deploy complete!${NC}"
echo "${BLUE}============================================================${NC}"
echo ""
echo "  Frontend:  https://bengaliislamicinstitute.com/   (after DNS / host config)"
echo "  API:       https://bengaliislamicinstitute.com/$API_DIR/  (proxied via cPanel Node App)"
echo ""
echo "${YELLOW}Next steps on the server:${NC}"
echo "  1. Install Node.js v22 or v24 (LTS) on the server — e.g. via nvm:"
echo "       curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
echo "       nvm install 24"
echo ""
echo "  2. In cPanel → 'Setup Node.js App', create an application:"
echo "       - Node version: 24"
echo "       - Application root: $API_DIR"
echo "       - Application URL: /$API_DIR (or set up a reverse proxy from /api)"
echo "       - Application startup file: index.mjs"
echo "       - Passenger log file: (default)"
echo "       Then 'Run NPM Install' (no-op, no node_modules needed) and 'Restart'."
echo ""
echo "  3. Run the database migration. Either via cPanel → Terminal, or via a"
echo "     one-off SSH session, in the api dir:"
echo "       DATABASE_URL='mysql://bengalii_boloban_db:bengalii_boloban_db@localhost:3306/bengalii_boloban_db' \\"
echo "         npx drizzle-kit push --config /dev/stdin <<< '\$drizzle\$'"
echo "     …or use the bundled schema with:"
echo "       mysql -h localhost -u bengalii_boloban_db -pbengalii_boloban_db bengalii_boloban_db \\"
echo "         < artifacts/api-server/.sql/marketplace.sql"
echo "     The first request to /api/products will seed the catalog automatically."
echo ""
echo "  4. Set up the reverse proxy from /api to the Node app port (8080) in"
echo "     cPanel → Apache Configuration or via .htaccess:"
echo "       RewriteEngine On"
echo "       RewriteRule ^api/(.*)\$ http://localhost:8080/api/\$1 [P,L]"
echo ""
echo "  5. Hard refresh (Ctrl+Shift+R) to see the new frontend."
echo ""
