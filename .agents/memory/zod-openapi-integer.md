---
name: OpenAPI integer compatibility
description: A generated Zod client in this workspace uses Zod 3 and does not support Orval's z.int() output.
---

Use `type: number` for API numeric fields that do not need runtime integer validation in OpenAPI specs; this keeps generated Zod schemas compatible with the installed Zod version.

**Why:** Code generation succeeded, but the chained library typecheck failed whenever OpenAPI `integer` became `z.int()`.

**How to apply:** If integer semantics are important, add an explicit runtime refinement in a hand-written server schema rather than reintroducing incompatible generated `z.int()` output.