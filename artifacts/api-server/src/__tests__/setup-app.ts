/**
 * Test harness: build the api-server Express app with a mocked DB.
 *
 * The api-server imports `db` and the table references from `@workspace/db`
 * — that's the single seam we mock.  In tests, those imports resolve to a
 * better-sqlite3 in-memory instance that we control.
 *
 * The challenge: `vi.mock` is hoisted to the top of the file, so the
 * mock factory runs before any module-level code.  We can't directly
 * share a binding between the mock factory and the rest of the file
 * unless we use `vi.hoisted`, but `vi.hoisted` runs synchronously and
 * the test-db module is `.ts` (and vitest's resolver isn't available
 * there).  Solution: a tiny global object that the mock factory and
 * the test helpers both reference; the mock factory populates it on
 * each call, and the test helpers re-read the current value.
 *
 * Pattern: `globalThis.__bolobanTestDb__` is a mutable slot.  The mock
 * factory sets it; `resetTestDb` reads it.
 */

import { eq } from "drizzle-orm";
import { vi } from "vitest";
import supertest from "supertest";
import type { Express } from "express";

interface TestDb {
  db: unknown;
  raw: unknown;
  schema: unknown;
  reset: () => void;
  close: () => void;
}

interface TestDbModule {
  createTestDb: () => TestDb;
  TEST_TABLES: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line no-var
  var __bolobanTestDb__: TestDb | undefined;
}

vi.mock("@workspace/db", async () => {
  const mod = (await import(
    "../../../../lib/db/src/__tests__/test-db.js" as string
  )) as TestDbModule;
  // Always create a fresh testDb when the factory runs (which happens
  // after every vi.resetModules).
  const testDb = mod.createTestDb();
  globalThis.__bolobanTestDb__ = testDb;
  return new Proxy(
    {
      ...mod.TEST_TABLES,
      db: testDb.db,
      pool: testDb.raw,
      schema: testDb.schema,
    },
    {
      get(target, prop) {
        return Reflect.get(target, prop);
      },
    },
  );
});

// Imports below this point are safe — the mock is registered before
// any of them run.
import { createSession } from "../lib/sessions.js";
import { ensureAuthTables, resetEnsureAuthTables } from "../lib/ensureAuthTables.js";
import { hashPassword } from "../lib/passwords.js";
import { db, usersTable } from "@workspace/db";

async function loadApp(): Promise<Express> {
  // `vi.resetModules` re-evaluates app.ts and its transitive imports
  // with the active mock state.  After this, the next time a route
  // code reads from `@workspace/db`, the mock factory is invoked
  // again, creating a fresh testDb.
  vi.resetModules();
  const mod = await import("../app.js");
  return mod.default;
}

export async function getApp(): Promise<Express> {
  return loadApp();
}

export async function getRequest() {
  const app = await getApp();
  return supertest(app);
}

export function resetTestDb() {
  if (globalThis.__bolobanTestDb__) {
    globalThis.__bolobanTestDb__.reset();
  }
  resetEnsureAuthTables();
}

export function closeTestDb() {
  if (globalThis.__bolobanTestDb__) globalThis.__bolobanTestDb__.close();
}

export function getTestDbInstance(): TestDb {
  if (!globalThis.__bolobanTestDb__) {
    throw new Error("Test DB not yet initialised — call getApp() first");
  }
  return globalThis.__bolobanTestDb__;
}

/**
 * Create a test user (idempotent on email) and return a session token +
 * the user.  Tests then attach the session cookie to supertest requests
 * via the returned `sessionId`.
 */
export async function createTestUser(
  email: string,
  password: string,
  role: "shopper" | "seller" | "admin" = "shopper",
  overrides: { name?: string; phone?: string } = {},
) {
  await ensureAuthTables();
  const existing = await db
    .select()
    .from(usersTable)
    .limit(50)
    ;
  const match = existing.find((u) => u.email === email);
  let user = match;
  if (!user) {
    const passwordHash = await hashPassword(password);
    await db.insert(usersTable).values({
      email,
      passwordHash,
      name: overrides.name ?? email.split("@")[0]!,
      phone: overrides.phone ?? "",
      role,
    });
    // Re-select to get the inserted row (MySQL doesn't support
    // .returning()).
    const inserted = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);
    user = inserted[0];
  }
  if (!user) throw new Error("createTestUser: could not create user");
  const { id: sessionId } = await createSession(user.id);
  return { user, sessionId };
}
