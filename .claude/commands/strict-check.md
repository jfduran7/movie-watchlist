---
description: Exhaustive audit of TypeScript strict mode. Finds type violations and reports without auto-fixing.
---

# /strict-check

Audits the repository for TypeScript strict mode violations and the typing rules defined in `CLAUDE.md`.

## Tasks

1. **Verify configuration:**
   - Confirm `tsconfig.json` has `"strict": true` (and related flags: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `noImplicitThis`, `alwaysStrict`, `strictBindCallApply`, `strictPropertyInitialization`).
   - If any of these are disabled, report it as a critical finding.

2. **Scan source code** (`backend/src/**` and `frontend/src/**`, excluding `node_modules`, `dist`, `build`, generated files like `schema.d.ts`):
   - Explicit use of `any` (including `: any`, `as any`, `Array<any>`, `Record<string, any>`, etc.).
   - Use of `as unknown as X` (double downcasts that bypass the type system).
   - Comments `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`. If they exist, validate they have a comment on the line above justifying them. If not, report it.
   - Public functions or service methods without explicit return types.
   - Function parameters without types (would fall into implicit `any` if not for strict).
   - Use of `Function` or `Object` as types (must be specific signatures or `unknown`).
   - Use of `!` (non-null assertion) — report all cases for review. Not forbidden, but must be deliberate.

3. **Scan for project-specific rule violations** (defined in `CLAUDE.md`):
   - `console.log`, `console.error`, `console.warn` in production code (everything outside `*.spec.ts`, `*.test.ts`, and `seeds/`).
   - Commented-out code blocks (commented lines that look like code, not documentation).
   - Endpoints without DTOs decorated with `class-validator`.
   - Endpoints without Swagger decorators (`@ApiOperation`, `@ApiResponse`).

4. **Generate a structured report** in this format:

```
# Strict Check Report

## ❌ Critical (n findings)
- backend/src/modules/reviews/reviews.service.ts:42 — Use of `any` on parameter `data`
- backend/src/modules/movies/movies.controller.ts:18 — Endpoint without validated DTO

## ⚠️ Warning (n findings)
- backend/src/modules/auth/auth.service.ts:67 — Non-null assertion without justifying comment

## ℹ️ Info (n findings)
- ...

## Summary
- Files scanned: X
- Critical: N
- Warnings: N
- Status: ❌ FAIL / ✅ PASS
```

## Rules

- **Do not modify code.** This command only audits and reports.
- If the repository has no source code yet, report `No findings: project has no source files yet.` and exit.
- Use `grep`/`rg` for speed; do not read full files unnecessarily.
- Always exclude: `node_modules/`, `dist/`, `build/`, `coverage/`, generated `*.d.ts` files, `migrations/` (schema changes may contain unusual strings).
- At the end of the report, suggest the 1–3 most important findings to address first, without implementing the fix.