/**
 * Server-side session store.  Each successful signin / signup mints a
 * random opaque token and persists it in `marketplace_sessions`.  The
 * client receives the token in an httpOnly cookie and sends it back
 * on every request; the `attachUser` middleware (see
 * `middlewares/requireUser.ts`) reads it, looks up the row, and
 * populates `req.user`.
 *
 * The MySQL Drizzle driver uses `await` semantics on inserts (no
 * `.run()`), and `await` on selects (no `.all()`).  The api-server
 * runs against MySQL in production; the test suite mocks `@workspace/db`
 * with better-sqlite3 but uses the same query shapes (the SQLite
 * driver accepts `await` too — `.all()` / `.run()` are just
 * convenience wrappers on top of `await`).
 */

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, sessionsTable, usersTable, type User } from "@workspace/db";

export const SESSION_COOKIE = "boloban_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  imageUrl: string;
  createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt instanceof Date
      ? user.createdAt.toISOString()
      : new Date(user.createdAt as unknown as number).toISOString(),
  };
}

export async function createSession(userId: number): Promise<{
  id: string;
  expiresAt: Date;
}> {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessionsTable).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export async function getSession(
  sessionId: string,
): Promise<{ user: User } | null> {
  if (!sessionId) return null;
  const rows = await db
    .select({ session: sessionsTable, user: usersTable })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(eq(sessionsTable.id, sessionId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const expires = row.session.expiresAt;
  const expDate = expires instanceof Date
    ? expires
    : new Date(expires as unknown as number);
  if (expDate.getTime() <= Date.now()) return null;
  return { user: row.user };
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
}
