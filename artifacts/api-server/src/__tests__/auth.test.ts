// IMPORTANT: import setup-app FIRST so the vi.mock("@workspace/db") call
// is registered before any other module reads from @workspace/db.
import { closeTestDb, createTestUser, getRequest, resetTestDb } from "./setup-app.js";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { hashPassword, verifyPassword } from "../lib/passwords.js";
import { SESSION_COOKIE } from "../lib/sessions.js";

let request: Awaited<ReturnType<typeof getRequest>>;

beforeAll(async () => {
  request = await getRequest();
});
afterAll(() => closeTestDb());
beforeEach(() => resetTestDb());

describe("password hashing", () => {
  it("hashes and verifies the same password", async () => {
    const hash = await hashPassword("hunter2-very-long");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("hunter2-very-long", hash)).toBe(true);
  });
  it("rejects a wrong password", async () => {
    const hash = await hashPassword("hunter2-correct");
    expect(await verifyPassword("hunter2-wrong", hash)).toBe(false);
  });
  it("rejects a malformed stored value", async () => {
    expect(await verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything", "scrypt$16384$8$1$00$00")).toBe(false);
  });
  it("hashes have unique salts", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});

describe("POST /api/auth/signup", () => {
  it("creates a user, sets the session cookie, and returns the public user", async () => {
    const res = await request.post("/api/auth/signup").send({
      email: "Shopper@Boloban.Local",  // mixed case to test normalization
      password: "Shopper123!",
      name: "Anika H.",
      role: "shopper",
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      user: {
        email: "shopper@boloban.local",
        name: "Anika H.",
        role: "shopper",
        imageUrl: expect.stringContaining("dicebear"),
      },
    });
    // The session cookie should be present and httpOnly.
    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join("\n") : setCookie;
    expect(cookieStr).toContain(SESSION_COOKIE);
    expect(cookieStr.toLowerCase()).toContain("httponly");
  });

  it("rejects a short password", async () => {
    const res = await request.post("/api/auth/signup").send({
      email: "a@b.com",
      password: "short",
      name: "X",
    });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request.post("/api/auth/signup").send({
      email: "not-an-email",
      password: "longenough",
      name: "X",
    });
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate email", async () => {
    await request.post("/api/auth/signup").send({
      email: "dup@boloban.local",
      password: "longenough",
      name: "X",
    });
    const res = await request.post("/api/auth/signup").send({
      email: "dup@boloban.local",
      password: "longenough",
      name: "X",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it("defaults role to shopper when not provided", async () => {
    const res = await request.post("/api/auth/signup").send({
      email: "no-role@boloban.local",
      password: "longenough",
      name: "No Role",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("shopper");
  });
});

describe("POST /api/auth/signin", () => {
  beforeEach(async () => {
    await request.post("/api/auth/signup").send({
      email: "user@boloban.local",
      password: "Password123!",
      name: "User",
      role: "admin",
    });
    // Sign out so the next signin is a clean test.
    await request.post("/api/auth/signout");
  });

  it("returns the user and sets a cookie on valid credentials", async () => {
    const res = await request.post("/api/auth/signin").send({
      email: "user@boloban.local",
      password: "Password123!",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("user@boloban.local");
    expect(res.body.user.role).toBe("admin");
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request.post("/api/auth/signin").send({
      email: "user@boloban.local",
      password: "WRONG",
    });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request.post("/api/auth/signin").send({
      email: "noone@boloban.local",
      password: "Password123!",
    });
    expect(res.status).toBe(401);
  });

  it("is case-insensitive on email", async () => {
    const res = await request.post("/api/auth/signin").send({
      email: "USER@BOLOBAN.LOCAL",
      password: "Password123!",
    });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/auth/signout", () => {
  it("clears the cookie and deletes the session", async () => {
    const { sessionId } = await createTestUser("sout@boloban.local", "Password123!");
    const before = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      ;
    expect(before).toHaveLength(1);

    const res = await request
      .post("/api/auth/signout")
      .set("Cookie", `${SESSION_COOKIE}=${sessionId}`);
    expect(res.status).toBe(204);

    const after = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, sessionId))
      ;
    expect(after).toHaveLength(0);

    const setCookie = res.headers["set-cookie"];
    expect(setCookie).toBeDefined();
    const cookieStr = Array.isArray(setCookie) ? setCookie.join("\n") : setCookie;
    // The expired cookie should be cleared.
    expect(cookieStr.toLowerCase()).toMatch(new RegExp(`${SESSION_COOKIE}=;|expires=Thu, 01 Jan 1970`));
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a session cookie", async () => {
    const res = await request.get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the user when a valid session is presented", async () => {
    const { user, sessionId } = await createTestUser("me@boloban.local", "Password123!", "seller");
    const res = await request
      .get("/api/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      id: user.id,
      email: "me@boloban.local",
      role: "seller",
    });
  });

  it("returns 401 for an expired session", async () => {
    const { user, sessionId } = await createTestUser("exp@boloban.local", "Password123!");
    // Force the session to be expired.
    await db
      .update(sessionsTable)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(sessionsTable.id, sessionId))
      ;
    const res = await request
      .get("/api/auth/me")
      .set("Cookie", `${SESSION_COOKIE}=${sessionId}`);
    expect(res.status).toBe(401);
    // And the user still exists — we don't auto-delete on expiry.
    const still = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      ;
    expect(still).toHaveLength(1);
  });
});

describe("POST /api/dev/seed-users", () => {
  it("rejects requests without the seed key", async () => {
    const res = await request.post("/api/dev/seed-users");
    expect(res.status).toBe(403);
  });

  it("seeds the three demo users when the correct key is supplied", async () => {
    // Stash and restore the env var.
    const prev = process.env["DEV_SEED_KEY"];
    process.env["DEV_SEED_KEY"] = "test-seed-key-123";
    try {
      const res = await request
        .post("/api/dev/seed-users?key=test-seed-key-123")
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.users).toHaveLength(3);
      const emails = res.body.users.map((u: { email: string }) => u.email);
      expect(emails).toContain("shopper@boloban.local");
      expect(emails).toContain("seller@boloban.local");
      expect(emails).toContain("admin@boloban.local");
    } finally {
      if (prev === undefined) delete process.env["DEV_SEED_KEY"];
      else process.env["DEV_SEED_KEY"] = prev;
    }
  });

  it("is idempotent on second call", async () => {
    const prev = process.env["DEV_SEED_KEY"];
    process.env["DEV_SEED_KEY"] = "idem";
    try {
      // Use unique email per test run so the test is independent of
      // the state left over from other auth tests.
      const first = await request.post("/api/dev/seed-users?key=idem&_testRun=" + Date.now());
      const second = await request.post("/api/dev/seed-users?key=idem&_testRun=" + Date.now());
      expect(first.body.users.every((u: { status: string }) => u.status === "created")).toBe(true);
      expect(second.body.users.every((u: { status: string }) => u.status === "exists")).toBe(true);
    } finally {
      if (prev === undefined) delete process.env["DEV_SEED_KEY"];
      else process.env["DEV_SEED_KEY"] = prev;
    }
  });
});
