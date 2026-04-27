# AI Workflow

How this project was built with Claude (claude-sonnet-4-6 via Claude Code CLI), and what that collaboration actually looked like.

---

## Step 1: The core contract — CLAUDE.md

The first thing written was `CLAUDE.md`, before any code. Its role is to define the box the AI operates in: stack, folder structure, naming conventions, required patterns, anti-patterns, business rules, and design decisions that are already closed.

This was the single most important investment. Without it, each session would produce slightly different conventions, different patterns, different opinions. With it, every session starts from the same ground truth. The file acts as a persistent, version-controlled system prompt that survives context resets.

Key decisions locked down in `CLAUDE.md` so they couldn't be relitigated:
- TypeORM over Prisma
- `synchronize: false` — all schema changes through migrations only
- No `any`, no `@ts-ignore`, no business logic in controllers
- Frontend types generated from the OpenAPI spec, never written by hand
- `bcrypt` for passwords, JWT for auth (stateless)
- Ownership enforced in the service layer, not just by `JwtAuthGuard`

---

## Step 2: Slash commands

Two project-scoped slash commands live in `.claude/commands/`. They are available in any Claude Code session inside this repo.

### `/review`

Runs a structured pre-commit review of all pending changes (staged + unstaged) against the rules in `CLAUDE.md`. It produces a tiered report:

- **Blockers** — must be fixed before committing (violations of CLAUDE.md sections 5.1–5.6, anti-patterns from §6, business rule gaps from §3).
- **Recommendations** — worth addressing, not blocking.
- **OK** — files with no findings.

The command does not modify code. It only reads and reports. The intent is to catch rule violations before a commit rather than in a post-merge review.

### `/strict-check`

An exhaustive TypeScript strict mode audit. It verifies that `"strict": true` is active in `tsconfig.json` and then scans source files for explicit `any`, double downcasts (`as unknown as X`), suppressed type errors without justification, missing return types on public methods, non-null assertions (`!`), and banned types like `Function` or `Object`.

It also cross-checks project-specific rules: `console.log` in production paths, commented-out code blocks, endpoints missing validated DTOs or Swagger decorators.

Like `/review`, it does not fix anything. It produces a Critical / Warning / Info tiered report.

Both commands are designed to be used together at the end of an implementation session: `/review` checks architectural rules, `/strict-check` checks type safety.

---

## Step 3: Specialized agents

Two subagents live in `.claude/agents/`. Unlike slash commands, agents are autonomous: they have their own instruction set, tools, and decision boundaries. They work within the same `CLAUDE.md` contract but operate independently from the main conversation.

### `code-reviewer`

Reviews code changes against `CLAUDE.md` and reports violations without fixing them. Its checklist mirrors `/review` but is more thorough: it walks through structural rules (thin controllers, DTO validation, error handling, authorization, logging, config access), checks all business rules from §3, and scans for every anti-pattern in §6.

This agent is **triggered automatically** by Claude Code after writing or modifying any backend or frontend code — no explicit invocation needed. It runs as a passive check layer after each implementation step.

To trigger it manually: mention it explicitly or ask for a code review. For example: "run the code-reviewer agent on the watchlist module."

### `test-writer`

Writes Jest unit tests for Nest.js services following the project's testing patterns. It reads the service under test, its DTOs and entities, identifies methods with branching logic, and writes the spec file using the `getRepositoryToken` mock pattern required by `CLAUDE.md §8`.

Critical business rule cases are mandatory: reviewing a non-watched movie must fail, duplicate reviews must fail, modify/delete on another user's resource must fail, stat calculations on empty data must not throw. After writing, it runs the tests and reports pass/fail. If a test surfaces a real bug in the service, it documents the expected behavior but does not fix the service itself.

This agent is **triggered automatically** after a new service is implemented and needs coverage. It can also be triggered manually by asking it to write tests for a specific service, e.g.: "use the test-writer agent on reviews.service.ts."

---

## Division of labor

### Human-owned

- Architecture and all decisions captured in `CLAUDE.md`
- Data model design
- Business rules definition
- Implementing each service method against the business rules
- Code review of every generated file before moving on
- Catching bugs (see below)
- Product decisions: what features exist, how the UX should feel
- Analyzing tradeoffs (TypeORM vs. Prisma, migrations vs. `synchronize`, OpenAPI generation approach)
- This document

### AI-assisted

- Scaffolding all NestJS modules following the agreed structure (entity → DTO → service → controller → spec)
- Writing unit tests for all services using the mocked repository pattern
- Refactoring services to return DTOs instead of raw entities (done in bulk across three modules)
- Setting up the frontend: Vite config, Tailwind v4, path aliases, Zustand stores, routing with auth guards
- Generating the Docker setup (Dockerfile for each service, Compose orchestration)
- Writing documentation

---

## Step 4: Model delegation — Opus/Sonnet for planning, Haiku for boilerplate

Not every task requires the same model. Claude Code lets you choose which model handles a given request, and that choice has a meaningful impact on cost and throughput for repetitive work.

In this project the division followed the cognitive weight of the task:

**Opus and Sonnet** were used for:
- Designing the module structure 
- Planning the authorization strategy
- Deciding how the `TransformInterceptor` response envelope should work
- Reviewing complex service implementations for correctness

These tasks require judgment, context synthesis, and understanding of competing constraints. They benefit from a more capable model.

**Haiku** was delegated for:
- Scaffolding repetitive module boilerplate (entity → DTO → service → controller → module) once the pattern was established
- Writing the Docker configuration once the architecture was fixed
- Generating documentation sections that follow a defined structure
- Populating `@ApiProperty` and `class-validator` decorators across DTOs

These tasks are mechanical once the pattern is clear: the output is predictable, the input is well-specified, and mistakes are cheap to catch. Running them on Haiku reduces cost without reducing quality, because quality here is defined by pattern adherence — not by judgment.

The practical boundary: if a task requires deciding something, use a capable model. If a task requires following a template already decided, delegate to Haiku.

---

## What the workflow looked like in practice

Sessions were task-scoped. A typical session:

1. Plan based on the features
2. Assign tasks to be refined by the **Opus/Sonnet** agent, and assign tasks to **Haiku** sub-agents
3. AI reads the relevant files, proposes the change
4. Change is applied; tests run
5. Move to the next task or fix what broke

The AI was never given open-ended directives like "build the backend." Everything was one concrete task at a time, reviewed before proceeding.

---
