---
description: Reviews pending changes (staged + unstaged) against CLAUDE.md rules before committing. Reports without auto-fixing.
---

# /review

Reviews pending changes in the repository (working directory + staged) against the rules established in `CLAUDE.md`. This is a self-review prior to committing.

## Tasks

1. **Detect changes:**
   - List modified files using `git status --short` and `git diff --name-only HEAD`.
   - If there are no changes, report: `No pending changes.` and exit.
   - If there are changes outside `backend/`, `frontend/`, `.claude/`, or repo root, warn.

2. **Read `CLAUDE.md`** end to end for the current rule context. If it was modified in this diff, note it and treat the new version as the source of truth.

3. **Review each modified file against `CLAUDE.md` sections:**

   **Backend (`backend/src/**/*.ts`):**
   - Module structure correct (§4): controller, service, module, dto/, entities/.
   - Thin controllers (§5.1): no business logic, no `if`s on data.
   - DTOs with `class-validator` and `@ApiProperty` decorators (§5.2 and Swagger rules).
   - Errors handled with Nest HTTP exceptions (§5.3): no `return null` for "not found" cases.
   - Authorization filtering by `userId` or using ownership guard (§5.4).
   - No `console.log` (§5.5). Nest Logger instead.
   - `process.env` only via `ConfigService` (§5.6).

   **Business rules (§3):**
   - Reviews only on movies marked `watched`.
   - One review per user+movie.
   - Stats computed live, not stored.
   - `Movie` catalog not mutable from public API.

   **Anti-patterns (§6):**
   - Use of `any` or `as any`.
   - `@ts-ignore` without justifying comment.
   - Logic in controllers.
   - Direct repository calls from controllers.
   - Committed `console.log`.
   - Commented-out code.
   - Entities exposed with sensitive fields (e.g., `passwordHash`).
   - Hashing with anything other than bcrypt/argon2.
   - Hardcoded JWT secret.

   **Frontend (`frontend/src/**/*.{ts,tsx}`):**
   - Does not manually define API types (must import from `@/api/schema`).
   - Folder structure per §9.
   - If backend DTOs changed, remind to regenerate client.

   **Tests (`*.spec.ts`):**
   - Critical cases covered (§8): reviews on non-watched, duplicates, ownership, empty stats.
   - Repository mocked via `getRepositoryToken`.

4. **Generate a structured report:**

```
# Review Report

Files reviewed: N

## ❌ Blockers (n)
These must be fixed before committing.
- backend/src/modules/reviews/reviews.controller.ts:34 — Business logic in controller (state validation belongs in the service). See CLAUDE.md §5.1.
- backend/src/modules/users/users.service.ts:88 — Use of `any` on parameter `filter`. See CLAUDE.md §6.

## ⚠️ Recommendations (n)
Worth addressing, but not blocking.
- backend/src/modules/movies/movies.controller.ts:22 — Missing `@ApiOperation`. Without it, the frontend client won't document this endpoint correctly.

## ✅ OK
- backend/src/modules/auth/auth.service.ts — no findings
- backend/src/modules/watchlist/watchlist.service.ts — no findings

## Next steps
1. Fix the 2 blockers.
2. After fixing, run `/strict-check` to confirm no `any` was introduced.
3. If the API contract changed, run `/regen-client` from `frontend/`.
```

## Rules

- **Do not modify code.** Only read, analyze, report.
- Always cite the `CLAUDE.md` section that backs each finding (e.g., `See CLAUDE.md §5.4`).
- If you find something not explicitly covered in `CLAUDE.md` but clearly an issue (e.g., logic bug, typo in critical string), report it under a separate section `## 🔍 Additional observations (not covered by CLAUDE.md)`.
- Be direct and concise. Do not enumerate everything that's correct — only what needs attention.