import path from "node:path";
import { defineConfig } from "vitest/config";

const r = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": r("artifacts/bazarhub/src"),
      // Workspace packages — alias to source so tests can import directly
      // without running the build step.
      "@workspace/db": r("lib/db/src/index.ts"),
      "@workspace/db/schema": r("lib/db/src/schema/index.ts"),
      "@workspace/api-zod": r("lib/api-zod/src/index.ts"),
      "@workspace/api-client-react": r("lib/api-client-react/src/index.ts"),
    },
  },
  // Inject VITE_CLERK_DEV_BYPASS into import.meta.env at compile time.
  // The shim's `import.meta.env.VITE_CLERK_DEV_BYPASS` reads will see
  // the value below.  When this is empty/anything-but-"true" the shim
  // throws, exactly as it would in production without a ClerkProvider.
  define: {
    "import.meta.env.VITE_CLERK_DEV_BYPASS": JSON.stringify(
      process.env.VITE_CLERK_DEV_BYPASS ?? "true",
    ),
  },
  env: {
    VITE_CLERK_DEV_BYPASS: process.env.VITE_CLERK_DEV_BYPASS ?? "true",
  },
  test: {
    projects: [
      {
        // Node tests — API, DB, API client, Clerk shim.
        test: {
          name: "node",
          environment: "node",
          include: [
            "lib/db/src/**/__tests__/**/*.test.ts",
            "artifacts/api-server/src/**/__tests__/**/*.test.ts",
            "lib/api-client-react/src/**/__tests__/**/*.test.ts",
            "artifacts/bazarhub/src/lib/__tests__/**/*.test.ts",
          ],
        },
      },
      {
        // Browser tests — cart, page components.
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: [
            "artifacts/bazarhub/src/**/__tests__/**/*.test.tsx",
            "artifacts/bazarhub/src/**/__tests__/**/*.test.ts",
          ],
        },
      },
    ],
  },
});
