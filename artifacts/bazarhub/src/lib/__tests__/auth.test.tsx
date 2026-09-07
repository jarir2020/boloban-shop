// @vitest-environment jsdom
import * as React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth, type PublicUser } from "@/lib/auth";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function mockFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = vi.fn(impl) as typeof fetch;
}

function AuthHost({ children }: { children?: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("auth context", () => {
  it("starts in loading, then resolves to unauthenticated when /me returns 401", async () => {
    mockFetch(async () => new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 }));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthHost });

    expect(result.current.status).toBe("loading");

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.user).toBeNull();
  });

  it("resolves to authenticated when /me returns a user", async () => {
    const stub: PublicUser = {
      id: 1,
      email: "u@b.com",
      name: "U",
      phone: "",
      role: "shopper",
      imageUrl: "https://example.com/u.svg",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    mockFetch(async () => new Response(JSON.stringify({ user: stub }), { status: 200 }));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthHost });

    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(stub);
  });

  it("signIn posts to /api/auth/signin and stores the user", async () => {
    const stub: PublicUser = {
      id: 7,
      email: "signin@b.com",
      name: "S",
      phone: "",
      role: "seller",
      imageUrl: "",
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const u = typeof url === "string" ? url : (url as URL).toString();
      expect(u).toBe("/api/auth/signin");
      expect(init?.method).toBe("POST");
      expect(init?.credentials).toBe("include");
      const body = init?.body ? JSON.parse(init.body as string) : null;
      expect(body).toEqual({ email: "signin@b.com", password: "Password123!" });
      return new Response(JSON.stringify({ user: stub }), { status: 200 });
    });
    mockFetch(fetchMock as typeof fetch);

    const { result } = renderHook(() => useAuth(), { wrapper: AuthHost });

    // Wait for the initial /me call to settle.
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));

    const user = await result.current.signIn("signin@b.com", "Password123!");
    expect(user).toEqual(stub);
    await waitFor(() => expect(result.current.status).toBe("authenticated"));
    expect(result.current.user).toEqual(stub);
  });

  it("signOut posts to /api/auth/signout and clears state", async () => {
    // Initial /me → 401, so unauthenticated.
    mockFetch(async (url) => {
      const u = typeof url === "string" ? url : (url as URL).toString();
      if (u === "/api/auth/me") {
        return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });
      }
      if (u === "/api/auth/signout") {
        return new Response(null, { status: 204 });
      }
      throw new Error(`Unexpected URL: ${u}`);
    });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthHost });

    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    await result.current.signOut();
    await waitFor(() => expect(result.current.status).toBe("unauthenticated"));
    expect(result.current.user).toBeNull();
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    // Suppress the error log from React for the expected throw.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
    consoleError.mockRestore();
  });
});
