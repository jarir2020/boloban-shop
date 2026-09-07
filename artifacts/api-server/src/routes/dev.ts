/**
 * /api/dev/* — one-shot endpoints for the live demo deployment.
 *
 * `POST /api/dev/seed-users` idempotently inserts three demo users
 * (shopper, seller, admin).  Guarded by `?key=$DEV_SEED_KEY` (or
 * `x-dev-seed-key` header) so random traffic can't trigger it.
 *
 * Disabled in production unless `DEV_SEED_KEY` is set, in which case
 * the route is a no-op when the key is missing or wrong.
 *
 * Demo credentials are documented in README.md and in
 * `.env.production.example`.
 */

import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../lib/passwords";
import { ensureAuthTables } from "../lib/ensureAuthTables";

const router: Router = Router();

interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: "shopper" | "seller" | "admin";
  phone: string;
}

const DEMO_USERS: DemoUser[] = [
  { email: "shopper@boloban.local", password: "Shopper123!", name: "Anika H.", role: "shopper", phone: "01700000001" },
  { email: "seller@boloban.local", password: "Seller123!", name: "Tech Valley", role: "seller", phone: "01700000002" },
  { email: "admin@boloban.local",  password: "Admin123!",  name: "BOLOBAN Admin", role: "admin",  phone: "01700000003" },
];

function isAuthorised(req: { query: Record<string, unknown>; headers: Record<string, string | string[] | undefined> }): boolean {
  const expected = process.env["DEV_SEED_KEY"];
  if (!expected) return false;
  const fromQuery = typeof req.query["key"] === "string" ? req.query["key"] : "";
  const fromHeader = typeof req.headers["x-dev-seed-key"] === "string"
    ? req.headers["x-dev-seed-key"]
    : "";
  return fromQuery === expected || fromHeader === expected;
}

router.post("/seed-users", async (req, res) => {
  if (!isAuthorised(req)) {
    res.status(403).json({ error: "Missing or invalid DEV_SEED_KEY" });
    return;
  }
  await ensureAuthTables();

  const results: Array<{ email: string; status: "created" | "exists"; userId: number | null }> = [];
  for (const u of DEMO_USERS) {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, u.email))
      .limit(1);
    if (existing[0]) {
      results.push({ email: u.email, status: "exists", userId: existing[0].id });
      continue;
    }
    const passwordHash = await hashPassword(u.password);
    await db.insert(usersTable).values({
      email: u.email,
      passwordHash,
      name: u.name,
      phone: u.phone,
      role: u.role,
      imageUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.name)}&backgroundColor=f57224`,
    });
    const inserted = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, u.email))
      .limit(1);
    results.push({ email: u.email, status: "created", userId: inserted[0]?.id ?? null });
  }
  res.status(200).json({ ok: true, users: results });
});

export default router;
