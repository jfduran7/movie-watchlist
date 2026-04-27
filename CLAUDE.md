# CLAUDE.md

> Working guide for Claude (and any AI assistant) in this repository.
> Required reading before proposing changes.

## 1. Project context

**Movie Watchlist** REST API. Users manage their movie list with three statuses (`want` / `watching` / `watched`) and leave reviews on what they have watched.

Guiding principles for the project:

- One concern per module
- Clear separation of responsibilities across layers
- Input validation on all endpoints
- Structured, consistent error handling
- Enforce authorization, not just authentication
- Frontend typed against the actual backend contract

## 2. Stack

**Backend**
- Node.js (LTS)
- TypeScript with `strict: true` (non-negotiable)
- Nest.js
- TypeORM + PostgreSQL
- JWT via `@nestjs/passport` + `passport-jwt`
- `class-validator` + `class-transformer`
- Swagger (`@nestjs/swagger`)
- Jest (unit tests)

**Frontend**
- Vite + React + TypeScript
- HTTP client generated from the backend's OpenAPI spec (see section 9)

**Local infrastructure**
- Docker Compose (postgres + backend + frontend)

## 3. Business rules

These rules are validated in the service layer, not only in the database:

1. A user **can only review movies they have marked as `watched`** in their watchlist.
2. A user has **a single review per movie** (unique constraint in DB + service-layer validation with a clear error).
3. A user **can only modify/delete their own resources** (watchlist entries and reviews).
4. The `Movie` catalog is **global and immutable** from the public API. It is populated only via seed.
5. Profile statistics (total watched, average rating) are computed live from the DB; they are not stored denormalized.

If a rule appears to be violated in the code, **stop and ask** before continuing.

## 4. Code conventions

### Folder structure (backend)

```
backend/src/
├── modules/
│   ├── auth/              # registration, login, JWT strategy
│   ├── users/             # profile, stats
│   ├── movies/            # catalog
│   ├── watchlist/         # user entries
│   └── reviews/           # reviews
├── common/
│   ├── decorators/        # @CurrentUser, @Public, etc.
│   ├── filters/           # global HttpExceptionFilter
│   ├── guards/            # JwtAuthGuard, OwnershipGuard
│   ├── interceptors/
│   └── pipes/
├── database/
│   ├── data-source.ts
│   ├── migrations/
│   └── seeds/
├── config/                # typed configuration
└── main.ts
```

### Each module follows this structure

```
modules/<resource>/
├── dto/
│   ├── create-<resource>.dto.ts
│   └── update-<resource>.dto.ts
├── entities/
│   └── <resource>.entity.ts
├── <resource>.controller.ts
├── <resource>.service.ts
├── <resource>.module.ts
└── <resource>.service.spec.ts
```

### Naming

- Files: `kebab-case.type.ts` (e.g., `create-review.dto.ts`)
- Classes: `PascalCase`
- Variables and functions: `camelCase`
- Global constants: `UPPER_SNAKE_CASE`
- Endpoints: plural in kebab-case (`/watchlist`, `/reviews`, `/movies`)

### Imports

- Absolute paths via `tsconfig.json` (e.g., `@/modules/auth/...`), not `../../../`
- Order: Nest → external libs → internal, separated by blank lines

## 5. Required patterns

### 5.1 Thin controllers

Controllers only:
1. Receive the request
2. Rely on the global `ValidationPipe` to validate the DTO
3. Call a service method
4. Return the result

All business logic lives in services. If a controller has an `if` that isn't about the shape of the request, it's wrong.

### 5.2 DTOs with class-validator on EVERY endpoint

```typescript
// ✅ Correct
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}

// ❌ Wrong: accepting `body: any` or a type without validators
```

Swagger decorators on DTOs (`@ApiProperty`) are required — they are the source of the generated frontend client.

### 5.3 Error handling

- Use Nest's HTTP exceptions (`NotFoundException`, `ForbiddenException`, `ConflictException`, etc.).
- **Never** return `null` from a service when "not found" is an error: throw `NotFoundException`.
- A global `HttpExceptionFilter` exists in `common/filters/`. Shape:

```json
{
  "statusCode": 404,
  "message": "Movie with id 'abc' not found",
  "error": "Not Found",
  "path": "/movies/abc",
  "timestamp": "2026-04-27T..."
}
```

### 5.4 Success response shape

All successful responses are wrapped by a global `TransformInterceptor` in `common/interceptors/`. This keeps the success envelope symmetric with the error envelope.

Single resource:
```json
{
  "statusCode": 200,
  "data": { "id": "...", "title": "..." }
}
```

Collection (paginated):
```json
{
  "statusCode": 200,
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10
  }
}
```

Rules:
- Services return plain objects or arrays — the interceptor wraps them.
- `statusCode` in the body mirrors the HTTP status code (e.g., `201` for POST).
- `DELETE` endpoints that return no body respond with HTTP `204` and no envelope.
- Never construct the wrapper object manually inside a controller or service.

### 5.5 Authorization (ownership)

Authentication ≠ Authorization. A valid JWT does **not** authorize touching any resource.

Acceptable patterns:
- **Filter by `userId` in the query**: `repository.findOne({ where: { id, userId: user.id } })`. If it doesn't exist → `NotFoundException` (not `ForbiddenException`, to avoid leaking existence).
- **Verify ownership in the service** before mutating.

```typescript
// ✅ Correct
async update(id: string, userId: string, dto: UpdateReviewDto) {
  const review = await this.reviewRepo.findOne({ where: { id, userId } });
  if (!review) throw new NotFoundException(`Review ${id} not found`);
  // ...
}

// ❌ Wrong: relying on JwtAuthGuard alone
async update(id: string, dto: UpdateReviewDto) {
  const review = await this.reviewRepo.findOneBy({ id });
  // User A could edit User B's review
}
```

### 5.6 Logging

- Use Nest's `Logger`, never `console.log`/`console.error` in production code.
- `console.log` only during local debugging; must be removed before committing.
- In services: `private readonly logger = new Logger(SomeService.name);`

### 5.7 Environment variables

- All access to `process.env` goes through `ConfigService` from `@nestjs/config`.
- Configuration is typed and validated at startup (Joi).
- `.env.example` always kept up to date.

## 6. Anti-patterns (do not do)

- ❌ `any` or `as any` to bypass types. If TypeScript complains, understand why.
- ❌ `// @ts-ignore` or `// @ts-expect-error` without a comment explaining why it's necessary.
- ❌ Business logic in controllers.
- ❌ Direct repository calls from controllers.
- ❌ `console.log` in committed code.
- ❌ Commented-out code. If it's unused, delete it (Git remembers).
- ❌ Returning TypeORM entities directly from public endpoints if they expose sensitive fields (e.g., `passwordHash`). Use response DTOs or `@Exclude`.
- ❌ Hashing passwords with anything other than `bcrypt` or `argon2`.
- ❌ Storing the JWT secret in code.
- ❌ Suppressing ESLint rules without an inline justification.
- ❌ Creating large `index.ts` barrel exports that obscure dependencies.
- ❌ In the frontend: defining API response types manually. Always use the generated client.

## 7. Auth & flow

- `POST /auth/register` → creates user, returns JWT.
- `POST /auth/login` → validates credentials, returns JWT.
- Passwords hashed with **bcrypt** (cost factor minimum 10).
- JWT signed with secret from env, expires per `JWT_EXPIRES_IN` (default 1d).
- `@CurrentUser()` decorator extracts the user from the request on protected endpoints.
- `JwtAuthGuard` applied globally. Public endpoints marked with `@Public()`.

## 8. Testing

- Every service with business logic has a `*.service.spec.ts` with unit tests.
- Mock the repository (with `getRepositoryToken`) in unit tests.
- Critical cases to cover explicitly:
  - Reviewing a movie not marked as `watched` must fail.
  - Reviewing a movie already reviewed by the same user must fail.
  - Modify/delete operations on resources owned by another user must fail.
  - Stat calculations on empty data must not crash.

## 9. Frontend: client generated from OpenAPI

The frontend **does not manually define** API types. They are generated from the `openapi.json` exposed by the backend.

### Tools

- `openapi-typescript`: generates the type file from the spec.
- `openapi-fetch`: minimal typed fetch client that consumes those types.

### Flow

1. The backend exposes the spec at `http://localhost:3000/api-docs-json` (configured in `main.ts` via `SwaggerModule.setup`).
2. From `frontend/`:

```bash
npm run generate:api
# runs: openapi-typescript http://localhost:3000/api-docs-json -o src/api/schema.d.ts
```

3. Usage in code:

```typescript
import createClient from "openapi-fetch";
import type { paths } from "@/api/schema";

export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL });

// fully typed end-to-end
const { data, error } = await api.POST("/auth/login", {
  body: { email, password },
});
```

### Rules

- The `generate:api` command is run every time the API contract changes.
- The `schema.d.ts` file is committed (not gitignored). This way the frontend builds even when the backend is not running.
- If the backend is down, bring it up with `docker compose -f infra/docker-compose.yml up backend` before regenerating.
- On the backend, keep the Swagger decorators (`@ApiProperty`, `@ApiResponse`, `@ApiTags`) up to date — they are the source of truth for the contract.

### Frontend structure

```
frontend/src/
├── api/
│   ├── schema.d.ts        # generated, do not edit by hand
│   └── client.ts          # openapi-fetch instance
├── components/
├── hooks/
├── pages/
├── lib/
└── main.tsx
```

## 10. Data model

```
User (id, email, passwordHash, name, createdAt)
Movie (id, title, genre, releaseYear, description, posterUrl)
WatchlistEntry (id, userId, movieId, status, createdAt, updatedAt)
  - UNIQUE(userId, movieId)
  - status: 'want' | 'watching' | 'watched'
Review (id, userId, movieId, rating, comment, createdAt, updatedAt)
  - UNIQUE(userId, movieId)
  - rating: 1..5 (CHECK constraint in DB)
```

Relations use `onDelete: CASCADE` when the `User` is deleted.

## 11. Useful commands

```bash
# Backend
npm run start:dev              # watch mode
npm run lint
npm run format
npm run test                   # unit tests
npm run test:cov               # with coverage

# Database
npm run migration:generate -- src/database/migrations/<MigrationName>
npm run migration:run
npm run seed

# Frontend
npm run dev                    # vite dev server
npm run generate:api           # regenerate types from OpenAPI
npm run build

# Docker
docker compose -f infra/docker-compose.yml up -d           # postgres + backend + frontend
docker compose -f infra/docker-compose.yml down -v         # stop and remove volumes
```

## 12. When working on this project

1. Read this file end to end before proposing structural changes.
2. If a task conflicts with these rules, flag it before implementing.
3. When creating a new module, follow the structure in section 4.
4. Any new endpoint requires: validated DTO, Swagger decorators, auth guard (if applicable), service unit test.
5. After changing the API contract, remember to regenerate the frontend client (section 9).
6. When in doubt, prefer simple and explicit over abstract and "elegant".
7. Before adding a new dependency, justify it (what problem does it solve that we can't solve with what's already installed).

## 13. Design decisions already made (do not relitigate)

- **TypeORM over Prisma:** familiarity with the Repository pattern and tighter native integration with Nest.
- **PostgreSQL:** robust, well-supported, serious constraints.
- **Stateless JWT** over sessions: simplicity, no need for Redis.
- **Migrations over `synchronize: true`:** `synchronize` is forbidden outside tests. All schema mutations live in a committed migration.
- **Frontend in a sibling folder, not a Turborepo monorepo:** scope doesn't justify it.
- **Frontend client generated from OpenAPI:** prevents drift between backend and frontend types and eliminates hand-rolled types.
- **No E2E tests:** prioritize unit coverage of business logic.