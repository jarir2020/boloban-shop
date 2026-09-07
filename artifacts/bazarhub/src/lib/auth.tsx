/**
 * Custom auth — replaces the @clerk/react SDK with a small cookie-based
 * client that talks to the api-server's /api/auth/* routes.
 *
 * The server sets the `boloban_session` httpOnly cookie on signin /
 * signup; subsequent requests carry it automatically.  The frontend
 * just calls `me` on mount to learn who's signed in, and offers
 * `signIn` / `signUp` / `signOut` helpers that POST and re-validate.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "shopper" | "seller" | "admin";

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole | string;
  imageUrl: string;
  createdAt: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  signIn: (email: string, password: string) => Promise<PublicUser>;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    role?: UserRole;
  }) => Promise<PublicUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: PublicUser;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : null) ?? `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

async function getMe(): Promise<PublicUser | null> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "include",
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`Failed to load user (${res.status})`);
  }
  const data = (await res.json()) as AuthResponse;
  return data.user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const u = await getMe();
      setUser(u);
      setStatus(u ? "authenticated" : "unauthenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const data = await postJson<AuthResponse>("/api/auth/signin", {
        email,
        password,
      });
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    [],
  );

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      role?: UserRole;
    }) => {
      const data = await postJson<AuthResponse>("/api/auth/signup", input);
      setUser(data.user);
      setStatus("authenticated");
      return data.user;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await postJson("/api/auth/signout", {}).catch(() => {
      // Even if the call fails, clear local state so the UI reflects
      // the user's intent.
    });
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut, refresh }),
    [status, user, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
