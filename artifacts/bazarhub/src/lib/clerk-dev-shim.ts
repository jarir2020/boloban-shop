/**
 * Dev-only shim for Clerk hooks. Activated by VITE_CLERK_DEV_BYPASS=true.
 *
 * When the real <ClerkProvider> is missing (local dev without Clerk keys),
 * `useUser()` and `useClerk()` would throw. This module provides the same
 * surface area but returns sensible stubs.
 *
 * Production builds never import this — the dev-bypass in App.tsx keeps the
 * real <ClerkProvider> mounted whenever a real key is configured.
 */

/** Read the bypass flag on demand so tests can flip it without reloading. */
function isDevBypass(): boolean {
  // import.meta.env is replaced at build time; Vite injects VITE_* values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (import.meta as any).env?.VITE_CLERK_DEV_BYPASS === 'true';
}

type StubUser = {
  id: string;
  fullName: string;
  username: string;
  imageUrl: string;
  createdAt: string;
  primaryEmailAddress: { emailAddress: string } | null;
  emailAddresses: { emailAddress: string }[];
};

const stubUser: StubUser = {
  id: 'user_dev_local',
  fullName: 'BOLOBAN Dev',
  username: 'boloban-dev',
  imageUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=BOLOBAN%20Dev&backgroundColor=f57224',
  createdAt: new Date('2026-01-01').toISOString(),
  primaryEmailAddress: { emailAddress: 'dev@boloban.local' },
  emailAddresses: [{ emailAddress: 'dev@boloban.local' }],
};

export function useUserStub() {
  if (!isDevBypass()) {
    throw new Error(
      'useUser can only be used within the <ClerkProvider /> component. (Dev shim is inactive — set VITE_CLERK_DEV_BYPASS=true to enable local stubs.)',
    );
  }
  return {
    isLoaded: true,
    isSignedIn: true,
    user: stubUser,
  };
}

export function useClerkStub() {
  if (!isDevBypass()) {
    throw new Error(
      'useClerk can only be used within the <ClerkProvider /> component. (Dev shim is inactive — set VITE_CLERK_DEV_BYPASS=true to enable local stubs.)',
    );
  }
  return {
    addListener: (_cb: (state: { user: unknown }) => void) => () => {
      // No-op unsubscribe
    },
    signOut: async () => {
      // Local dev: refresh the page so the user lands back on home.
      window.location.assign('/');
    },
  };
}

export const __clerkDevBypass = isDevBypass();

