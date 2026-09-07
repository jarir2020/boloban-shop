import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, customFetch, setAuthTokenGetter, setBaseUrl } from "../custom-fetch.js";

const realFetch = global.fetch;

beforeEach(() => {
  setBaseUrl(null);
  setAuthTokenGetter(null);
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = realFetch;
});

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
}

describe("setBaseUrl", () => {
  it("does not change the URL when no base is set", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    expect(fetchMock).toHaveBeenCalledWith("/api/foo", expect.any(Object));
  });

  it("prepends the base URL to relative paths", async () => {
    const fetchMock = vi.mocked(global.fetch);
    setBaseUrl("https://api.example.com");
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/foo",
      expect.any(Object),
    );
  });

  it("strips a trailing slash from the base URL", async () => {
    const fetchMock = vi.mocked(global.fetch);
    setBaseUrl("https://api.example.com/");
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/foo",
      expect.any(Object),
    );
  });

  it("does not modify absolute URLs", async () => {
    const fetchMock = vi.mocked(global.fetch);
    setBaseUrl("https://api.example.com");
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("https://other.example.com/x");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://other.example.com/x",
      expect.any(Object),
    );
  });

  it("setBaseUrl(null) clears the prefix", async () => {
    const fetchMock = vi.mocked(global.fetch);
    setBaseUrl("https://api.example.com");
    setBaseUrl(null);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    expect(fetchMock).toHaveBeenCalledWith("/api/foo", expect.any(Object));
  });
});

describe("setAuthTokenGetter", () => {
  it("attaches a Bearer token when the getter returns a string", async () => {
    setAuthTokenGetter(() => "tok-123");
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer tok-123");
  });

  it("does not set Authorization when the getter returns null", async () => {
    setAuthTokenGetter(() => null);
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo");
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.has("authorization")).toBe(false);
  });

  it("respects an explicit Authorization header on the request", async () => {
    setAuthTokenGetter(() => "tok-123");
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
    await customFetch("/api/foo", { headers: { authorization: "Bearer explicit" } });
    const headers = (fetchMock.mock.calls[0]?.[1] as RequestInit).headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer explicit");
  });
});

describe("customFetch response handling", () => {
  it("parses JSON responses when content-type is application/json", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(jsonResponse({ hello: "world" }));
    const result = await customFetch<{ hello: string }>("/api/foo");
    expect(result).toEqual({ hello: "world" });
  });

  it("returns text for text/plain responses", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response("hello world", {
        status: 200,
        headers: { "content-type": "text/plain" },
      }),
    );
    const result = await customFetch<string>("/api/foo");
    expect(result).toBe("hello world");
  });

  it("throws an ApiError with status/data for non-2xx responses", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "boom" }), {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "content-type": "application/json" },
      }),
    );
    let caught: unknown;
    try {
      await customFetch("/api/foo");
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    const apiErr = caught as ApiError;
    expect(apiErr.status).toBe(500);
    expect(apiErr.statusText).toBe("Internal Server Error");
    expect(apiErr.data).toEqual({ error: "boom" });
  });

  it("strips BOM from JSON responses", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockResolvedValueOnce(
      new Response("﻿{\"a\":1}", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const result = await customFetch<{ a: number }>("/api/foo");
    expect(result).toEqual({ a: 1 });
  });

  it("rejects when a GET request carries a body", async () => {
    await expect(
      customFetch("/api/foo", { method: "GET", body: "{}" }),
    ).rejects.toThrow(/cannot have a body/i);
  });
});
