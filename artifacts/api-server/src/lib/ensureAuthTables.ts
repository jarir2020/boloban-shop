/**
 * Lazy DDL for the auth tables.  Called from /api/auth/* and /api/dev/seed-users
 * on first hit.
 *
 * Driver compatibility: MySQL exposes `db.execute(sql)`; better-sqlite3
 * exposes `db.run(sql)`.  We sniff the driver by name and dispatch to
 * the right method.  The CREATE TABLE statements are slightly
 * different per driver (`AUTO_INCREMENT` for MySQL, `AUTOINCREMENT`
 * for SQLite), so we keep two SQL strings.
 *
 * On MySQL the DDL runs once per process; on SQLite it runs once
 * per test.  Both are idempotent (`IF NOT EXISTS`).
 */

import { sql } from "drizzle-orm";
import { db, pool } from "@workspace/db";

let ensured = false;

const CREATE_USERS_MYSQL = `
  CREATE TABLE IF NOT EXISTS marketplace_users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'shopper',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`;

const CREATE_USERS_SQLITE = `
  CREATE TABLE IF NOT EXISTS marketplace_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'shopper',
    image_url TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000)
  )
`;

const CREATE_SESSIONS_MYSQL = `
  CREATE TABLE IF NOT EXISTS marketplace_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
  )
`;

const CREATE_SESSIONS_SQLITE = `
  CREATE TABLE IF NOT EXISTS marketplace_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') AS INTEGER) * 1000),
    expires_at INTEGER NOT NULL
  )
`;

function isSqlite(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (pool as any)?.constructor?.name === "Database";
}

export async function ensureAuthTables(): Promise<void> {
  if (ensured) return;
  if (isSqlite()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).run(sql.raw(CREATE_USERS_SQLITE));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).run(sql.raw(CREATE_SESSIONS_SQLITE));
  } else {
    await db.execute(sql.raw(CREATE_USERS_MYSQL));
    await db.execute(sql.raw(CREATE_SESSIONS_MYSQL));
  }
  ensured = true;
}

/** Reset the cache (used by tests). */
export function resetEnsureAuthTables(): void {
  ensured = false;
}
