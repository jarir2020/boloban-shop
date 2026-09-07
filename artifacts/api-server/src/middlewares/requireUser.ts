/**
 * Auth middleware.  Three helpers:
 *
 *   - `attachUser` — reads the `boloban_session` cookie, looks up the
 *     session, and attaches `req.user` (PublicUser or null).  Mount at
 *     app level so every route can use `req.user`.
 *
 *   - `requireAuth` — 401 if `req.user` is null.  Use on routes that
 *     only make sense for signed-in users (e.g. /api/auth/me, future
 *     /api/checkout).
 *
 *   - `requireRole(...roles)` — 403 if `req.user.role` is not in the
 *     list.  Always run `requireAuth` first; this only adds the role
 *     check.
 */

import type { NextFunction, Request, Response } from "express";
import {
  SESSION_COOKIE,
  getSession,
  toPublicUser,
  type PublicUser,
} from "../lib/sessions";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser | null;
    }
  }
}

function readSessionCookie(req: Request): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  // Quick cookie parser: `name=value; name=value`.  Avoids depending on
  // the `cookie` package for a single value.
  for (const pair of header.split(/;\s*/)) {
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    if (name !== SESSION_COOKIE) continue;
    return decodeURIComponent(pair.slice(eq + 1));
  }
  return null;
}

export async function attachUser(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionId = readSessionCookie(req);
  if (!sessionId) {
    req.user = null;
    next();
    return;
  }
  const session = await getSession(sessionId);
  req.user = session ? toPublicUser(session.user) : null;
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ error: "Sign in to continue" });
    return;
  }
  next();
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Sign in to continue" });
      return;
    }
    if (!allowed.includes(req.user.role)) {
      res.status(403).json({ error: "You do not have access to this resource" });
      return;
    }
    next();
  };
}
