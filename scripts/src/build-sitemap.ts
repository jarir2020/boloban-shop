/**
 * Build a sitemap.xml for the BolobanShop frontend.
 *
 * Usage:  pnpm --filter @workspace/scripts run build-sitemap -- \
 *             --base https://bengaliislamicinstitute.com \
 *             --api https://bengaliislamicinstitute.com/api
 *
 * Or, with no args, defaults to the production base/api.  Reads the
 * static route list from this file and the dynamic product list from
 * the api-server's /api/categories and /api/products endpoints.
 *
 * The output is written to `artifacts/bazarhub/public/sitemap.xml` and
 * is served by the static frontend at `/sitemap.xml`.
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..", "..");
const OUT = resolve(REPO, "artifacts/bazarhub/public/sitemap.xml");

interface CliArgs {
  base: string;
  api: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  // The marketplace is served at bengaliislamicinstitute.com, but the
  // Node API is reachable via the boloban.shop cPanel app URL.  These
  // defaults reflect the live deployment as of writing.
  let base = "https://bengaliislamicinstitute.com";
  let api = "https://boloban.shop/api";
  for (let i = 0; i < args.length; i += 2) {
    if (args[i] === "--base") base = args[i + 1] ?? base;
    else if (args[i] === "--api") api = args[i + 1] ?? api;
  }
  // Strip trailing slashes so `${base}/foo` is always well-formed.
  base = base.replace(/\/+$/, "");
  api = api.replace(/\/+$/, "");
  return { base, api };
}

const STATIC_ROUTES: Array<{
  path: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: number;
}> = [
  { path: "/",            changefreq: "daily",   priority: 1.0 },
  { path: "/products",    changefreq: "daily",   priority: 0.9 },
  { path: "/fresh-market", changefreq: "daily",  priority: 0.8 },
  { path: "/cart",        changefreq: "weekly",  priority: 0.4 },
  { path: "/orders",      changefreq: "weekly",  priority: 0.4 },
  { path: "/account",     changefreq: "monthly", priority: 0.3 },
  { path: "/sign-in",     changefreq: "monthly", priority: 0.2 },
  { path: "/sign-up",     changefreq: "monthly", priority: 0.3 },
  { path: "/seller",      changefreq: "monthly", priority: 0.2 },
  { path: "/admin",       changefreq: "monthly", priority: 0.2 },
];

interface ProductSummary { id: number; name: string }
interface CategorySummary { id: string }

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: number): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(1)}</priority>`,
    "  </url>",
  ].join("\n");
}

async function main() {
  const { base, api } = parseArgs();
  const now = new Date().toISOString().slice(0, 10);

  const entries: string[] = [];
  for (const route of STATIC_ROUTES) {
    entries.push(urlEntry(`${base}${route.path}`, now, route.changefreq, route.priority));
  }

  // Dynamic product URLs.
  let productCount = 0;
  try {
    const products = await fetchJson<ProductSummary[]>(`${api}/products?limit=50`);
    for (const p of products) {
      entries.push(urlEntry(`${base}/products/${p.id}`, now, "weekly", 0.7));
      productCount += 1;
    }
  } catch (err) {
    console.warn(`build-sitemap: skipping products (${(err as Error).message})`);
  }

  // Category-filtered listings.
  let categoryCount = 0;
  try {
    const categories = await fetchJson<CategorySummary[]>(`${api}/categories`);
    for (const c of categories) {
      entries.push(
        urlEntry(`${base}/products?category=${encodeURIComponent(c.id)}`, now, "daily", 0.6),
      );
      categoryCount += 1;
    }
  } catch (err) {
    console.warn(`build-sitemap: skipping categories (${(err as Error).message})`);
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(OUT, body, "utf8");
  console.log(
    `build-sitemap: wrote ${OUT} — ${STATIC_ROUTES.length} static + ${productCount} products + ${categoryCount} categories = ${entries.length} URLs`,
  );
}

main().catch((err) => {
  console.error("build-sitemap failed:", err);
  process.exit(1);
});
