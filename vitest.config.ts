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
  test: {
    projects: [
      {
        // Node tests — API, DB, API client.
        test: {
          name: "node",
          environment: "node",
          include: [
            "lib/db/src/**/__tests__/**/*.test.ts",
            "artifacts/api-server/src/**/__tests__/**/*.test.ts",
            "lib/api-client-react/src/__tests__/**/*.test.ts",
          ],
        },
      },
      {
        // Browser tests — cart, auth, page components.
        test: {
          name: "jsdom",
          environment: "jsdom",
          setupFiles: ["./vitest.setup.ts"],
          include: [
            "artifacts/bazarhub/src/lib/__tests__/**/*.test.tsx",
            "artifacts/bazarhub/src/lib/__tests__/**/*.test.ts",
          ],
        },
      },
    ],
  },
});

