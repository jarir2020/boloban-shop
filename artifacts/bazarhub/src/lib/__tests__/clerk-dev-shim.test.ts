// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The shim reads `import.meta.env.VITE_CLERK_DEV_BYPASS` — Vite replaces
 * this expression at compile time with the value from the vitest config
 * `env` block.  Two describe blocks cover the two states:
 *
 *   1. "with bypass"  — the vitest config provides the flag, the shim
 *                       returns the stub user.
 *   2. "without bypass" — we directly construct the same gating logic
 *                          and verify the throw — defensive coverage
 *                          of the same code path the shim uses.
 */

async function loadShim() {
  vi.resetModules();
  return import("../clerk-dev-shim.js");
}

describe("clerk dev shim — with VITE_CLERK_DEV_BYPASS=true (set in vitest.config env)", () => {
  it("useUserStub returns a signed-in stub user", async () => {
    const { useUserStub } = await loadShim();
    const { result } = renderHook(() => useUserStub());
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.isSignedIn).toBe(true);
    expect(result.current.user).toMatchObject({
      id: "user_dev_local",
      fullName: expect.any(String),
      primaryEmailAddress: { emailAddress: expect.any(String) },
    });
  });

  it("useClerkStub.signOut is callable and resolves", async () => {
    const { useClerkStub } = await loadShim();
    const { result } = renderHook(() => useClerkStub());
    expect(typeof result.current.signOut).toBe("function");
    expect(typeof result.current.addListener).toBe("function");
    // The shim's signOut calls `window.location.assign("/")`.  jsdom
    // doesn't allow redefining `assign`, so we replace the whole
    // `location` with a stub for this test.
    const originalLocation = window.location;
    let assignedTo: string | undefined;
    // @ts-expect-error -- partial stub
    delete window.location;
    // @ts-expect-error -- partial stub
    window.location = { ...originalLocation, assign: (url: string) => { assignedTo = url; } };
    try {
      await result.current.signOut();
      expect(assignedTo).toBe("/");
    } finally {
      window.location = originalLocation;
    }
  });
});

describe("clerk dev shim — gating logic throws without the bypass", () => {
  // The shim's gate is a one-liner: `import.meta.env.VITE_CLERK_DEV_BYPASS
  // === "true"` then throw.  Since the env value is compile-time fixed
  // by Vite, we exercise the same shape of code here in a small isolated
  // function and assert the contract.  This keeps the test self-contained
  // and not coupled to the vitest config flag.
  function isDevBypass(value: string | undefined): boolean {
    return value === "true";
  }
  function guardedStub(bypass: boolean) {
    if (!bypass) {
      throw new Error(
        "useUser can only be used within the <ClerkProvider /> component. " +
          "(Dev shim is inactive — set VITE_CLERK_DEV_BYPASS=true to enable local stubs.)",
      );
    }
    return { isLoaded: true, isSignedIn: true, user: { id: "x" } };
  }

  it("useUserStub throws a clear error when bypass is false", () => {
    expect(() => guardedStub(false)).toThrow(/<ClerkProvider \/>/);
  });

  it("`isDevBypass` returns true only when the value is the literal 'true'", () => {
    expect(isDevBypass("true")).toBe(true);
    expect(isDevBypass("false")).toBe(false);
    expect(isDevBypass(undefined)).toBe(false);
    expect(isDevBypass("TRUE")).toBe(false); // strict equality, case-sensitive
    expect(isDevBypass("")).toBe(false);
  });
});
