/**
 * Test harness: build the api-server Express app with a mocked DB and
 * mock Clerk so the tests run with no external services.
 *
 * The api-server imports `db` and the table references from `@workspace/db`
 * — that's the single seam we mock.  In tests, those imports resolve to a
 * better-sqlite3 in-memory instance that we control.
 */

import { vi } from "vitest";

// 1. Mock Clerk's express middleware before anything imports the app.
//    `clerkProxyMiddleware` is already a no-op in non-production.
vi.mock("@clerk/express", () => ({
  clerkMiddleware:
    () =>
    (_req: unknown, _res: unknown, next: () => void): void =>
      next(),
}));

// 2. Build the test DB and mock `@workspace/db` so route code uses it.
import { createTestDb, TEST_TABLES } from "../../../../lib/db/src/__tests__/test-db.js";
import supertest from "supertest";
import type { Express } from "express";

const testDb = createTestDb();

vi.mock("@workspace/db", () => ({
  ...TEST_TABLES,
  db: testDb.db,
  pool: testDb.raw,
  schema: testDb.schema,
}));

// 3. Lazily import the app so the mocks above are registered first.
let appPromise: Promise<Express> | undefined;

async function loadApp(): Promise<Express> {
  // `vi.resetModules` ensures the dynamic import re-evaluates app.ts and
  // its transitive imports with the active mock state.
  vi.resetModules();
  const mod = await import("../app.js");
  return mod.default;
}

export async function getApp(): Promise<Express> {
  if (!appPromise) appPromise = loadApp();
  return appPromise;
}

export async function getRequest() {
  const app = await getApp();
  return supertest(app);
}

export function resetTestDb() {
  testDb.reset();
}

export function closeTestDb() {
  testDb.close();
}

export { testDb };
