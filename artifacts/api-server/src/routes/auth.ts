/**
 * /api/auth/* — sign up, sign in, sign out, and `me`.
 *
 * Sessions are server-side, stored in `marketplace_sessions`.  The
 * client receives the session id in an `httpOnly` cookie
 * (`boloban_session`); `attachUser` reads it on every request.
 *
 * The two auth tables (marketplace_users, marketplace_sessions) are
 * created lazily on first call via `ensureAuthTables()`.  That's
 * idempotent and avoids a separate DDL step on first deploy.
 */

import { Router, type Response, type Request } from "express";
import { eq } from "drizzle-orm";
import {
  AuthResponse,
  SignInBody,
  SignUpBody,
} from "@workspace/api-zod";
import { db, usersTable, type User } from "@workspace/db";
import { hashPassword, verifyPassword } from "../lib/passwords";
import {
  SESSION_COOKIE,
  SESSION_TTL_MS,
  createSession,
  deleteSession,
  getSession,
  toPublicUser,
  type PublicUser,
} from "../lib/sessions";
import { ensureAuthTables } from "../lib/ensureAuthTables";

const router: Router = Router();
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_MS,
};

function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE, sessionId, COOKIE_OPTIONS);
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
}

function handleSignupError(err: unknown): { status: number; body: { error: string } } {
  const msg = err instanceof Error ? err.message : String(err);
  if (/duplicate|unique constraint|errno\s*1062/i.test(msg)) {
    return { status: 409, body: { error: "An account with that email already exists" } };
  }
  return { status: 500, body: { error: "Could not create the account. Please try again." } };
}

function readSessionIdFromCookie(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const pair of header.split(/;\s*/)) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    if (pair.slice(0, eq).trim() !== SESSION_COOKIE) continue;
    return decodeURIComponent(pair.slice(eq + 1));
  }
  return null;
}

async function findUserByEmail(email: string): Promise<User | undefined> {
  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0];
}

router.post("/signup", async (req, res) => {
  const parsed = SignUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email, password (8+ chars), and name are required" });
    return;
  }
  await ensureAuthTables();
  const { email, password, name, phone, role } = parsed.data;
  const passwordHash = await hashPassword(password);
  const finalRole = role ?? "shopper";

  // Reject duplicates before we even try the insert — the unique
  // constraint error from MySQL is hard to disambiguate from other
  // errors.  A quick `limit 1` is cheap.
  const existing = await findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists" });
    return;
  }

  let user: User | undefined;
  try {
    await db.insert(usersTable).values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name.trim(),
      phone: phone?.trim() ?? "",
      role: finalRole,
      imageUrl: defaultAvatar(name),
    });
    // MySQL's Drizzle driver doesn't support `.returning()` on inserts
    // (that's a SQLite/Postgres feature).  Re-select by the unique
    // email to get the inserted row.
    user = await findUserByEmail(email);
  } catch (err) {
    const { status, body } = handleSignupError(err);
    res.status(status).json(body);
    return;
  }
  if (!user) {
    res.status(500).json({ error: "Could not create the account" });
    return;
  }
  const { id: sessionId } = await createSession(user.id);
  setSessionCookie(res, sessionId);
  const publicUser: PublicUser = toPublicUser(user);
  res.status(201).json(AuthResponse.parse({ user: publicUser }));
});

router.post("/signin", async (req, res) => {
  const parsed = SignInBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  await ensureAuthTables();
  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Email or password is incorrect" });
    return;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Email or password is incorrect" });
    return;
  }
  const { id: sessionId } = await createSession(user.id);
  setSessionCookie(res, sessionId);
  const publicUser: PublicUser = toPublicUser(user);
  res.status(200).json(AuthResponse.parse({ user: publicUser }));
});

router.post("/signout", async (req, res) => {
  const sessionId = readSessionIdFromCookie(req);
  if (sessionId) await deleteSession(sessionId);
  clearSessionCookie(res);
  res.status(204).end();
});

router.get("/me", async (_req, res) => {
  await ensureAuthTables();
  if (!_req.user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.status(200).json(AuthResponse.parse({ user: _req.user }));
});

function defaultAvatar(name: string): string {
  const seed = encodeURIComponent(name.trim() || "BOLOBAN");
  return `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&backgroundColor=f57224`;
}

// Re-export so consumers (tests) can import `getSession` from this file
// without reaching into lib/sessions.
export { getSession };

export default router;
