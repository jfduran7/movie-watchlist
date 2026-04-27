# Backend

NestJS REST API for Movie Watchlist. Handles authentication, the movie catalog, watchlist management, and reviews.

> **New here?** Start with the [root README](../README.md) to get the project running first.

## Architecture overview

The API follows a strict layered architecture:

```
Request → Controller → Service → Repository → Database
```

- **Controllers** are thin: receive the request, call a service method, return the result. No business logic.
- **Services** own all business logic and talk to the database via TypeORM repositories.
- **DTOs** define and validate every request payload using `class-validator`. They are also the source of truth for the frontend's generated API client (via Swagger decorators).

All endpoints (except `/auth/*`) require a valid JWT. The `JwtAuthGuard` is applied globally; public endpoints are opt-out via the `@Public()` decorator.

## Module structure

Each feature lives in `src/modules/<name>/` and follows the same layout:

```
<module>/
├── dto/
│   ├── create-<module>.dto.ts    # validated request body for POST
│   ├── update-<module>.dto.ts    # validated request body for PATCH
│   └── <module>-response.dto.ts  # what the endpoint returns
├── entities/
│   └── <module>.entity.ts        # TypeORM entity
├── <module>.controller.ts
├── <module>.service.ts
└── <module>.service.spec.ts      # unit tests (required)
```

### Modules

| Module | Responsibility |
|---|---|
| `auth` | Register, login, JWT strategy |
| `users` | Profile and live statistics |
| `movies` | Read-only movie catalog with pagination and genre filtering |
| `watchlist` | Per-user watchlist entries with status tracking |
| `reviews` | Ratings and comments, scoped to watched movies |

## Common infrastructure

Located in `src/common/`:

| Path | What it does |
|---|---|
| `decorators/current-user.decorator.ts` | Extracts the authenticated user from the request — use `@CurrentUser()` in controllers |
| `decorators/public.decorator.ts` | Marks an endpoint as unauthenticated — use `@Public()` |
| `guards/jwt-auth.guard.ts` | Applied globally; skips routes decorated with `@Public()` |
| `interceptors/transform.interceptor.ts` | Wraps every successful response in `{ statusCode, data }` (or adds `meta` for paginated results) |
| `filters/http-exception.filter.ts` | Formats all errors as `{ statusCode, message, error, path, timestamp }` |

## Response envelope

Every successful response is wrapped automatically — never construct it manually.

**Single resource**
```json
{ "statusCode": 200, "data": { "id": "...", "title": "..." } }
```

**Paginated collection**
```json
{ "statusCode": 200, "data": [...], "meta": { "total": 42, "page": 1, "limit": 10 } }
```

`DELETE` endpoints return HTTP `204` with no body.

**Error**
```json
{ "statusCode": 404, "message": "Review not found", "error": "Not Found", "path": "/reviews/abc", "timestamp": "..." }
```

## Authorization

Authentication and authorization are separate concerns.

- A valid JWT proves identity, not permission.
- Ownership is enforced in the service layer by filtering queries with both `id` and `userId`. If the resource doesn't exist or belongs to another user, throw `NotFoundException` (not `ForbiddenException`) to avoid leaking existence.

```typescript
// correct pattern
const review = await this.reviewRepo.findOne({ where: { id, userId } });
if (!review) throw new NotFoundException('Review not found');
```

## Adding a new endpoint

1. Create or update the DTO in `dto/` with `class-validator` decorators and `@ApiProperty` on every field.
2. Add the service method with business logic and `NotFoundException`/`ForbiddenException` where appropriate.
3. Add the controller method — keep it to one line delegating to the service.
4. Add `@ApiOperation` and `@ApiResponse` decorators to the controller method.
5. Write or update `*.service.spec.ts` covering the happy path and every failure branch.
6. Regenerate the frontend client: `cd ../frontend && npm run generate:api`.

## Database migrations

Migrations live in `src/database/migrations/`. The app runs pending migrations automatically on startup via `dataSource.runMigrations()` in `main.ts`.

```bash
# Generate a migration from entity changes
npm run migration:generate -- src/database/migrations/<DescriptiveName>

# Apply manually (normally not needed — startup handles this)
npm run migration:run

# Roll back the last migration
npm run migration:revert
```

> `synchronize: true` is disabled and must never be enabled outside of tests. All schema changes go through migrations.

## Testing

Every service has a `*.service.spec.ts`. Repositories are mocked using `getRepositoryToken`.

```bash
npm run test          # run all unit tests
npm run test:cov      # with coverage report
npm run test:watch    # watch mode
```

Required cases to cover in every service:
- Happy path
- Resource not found
- Ownership violation (another user's resource)
- Business rule violations (e.g. reviewing a non-watched movie, duplicate review)

## Logging

Use `Logger` from `@nestjs/common`. Never use `console.log` in committed code.

```typescript
private readonly logger = new Logger(SomeService.name);
// then:
this.logger.log('...');
this.logger.warn('...');
this.logger.error('...');
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `DB_HOST` | `postgres` | Postgres hostname (`localhost` for local dev) |
| `DB_PORT` | `5432` | Postgres port |
| `DB_NAME` | `movie_watchlist` | Database name — must match `infra/.env` |
| `DB_USER` | `postgres` | Database user — must match `infra/.env` |
| `DB_PASS` | — | Database password — must match `infra/.env` |
| `JWT_SECRET` | — | Secret for signing JWTs |
| `JWT_EXPIRES_IN` | `1d` | Token expiration |
| `PORT` | `3000` | Listening port |
| `FRONTEND_URL` | `http://localhost:3001` | Allowed CORS origin |

## Scripts

```bash
npm run start:dev                                               # watch mode
npm run test                                                    # unit tests
npm run test:cov                                               # with coverage
npm run lint
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```
