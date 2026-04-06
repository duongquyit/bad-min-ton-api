# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm install
pnpm start:dev        # watch mode
pnpm build            # compile TypeScript → dist/

# Testing
pnpm test             # unit tests
pnpm test:watch       # unit tests in watch mode
pnpm test:cov         # with coverage
pnpm test:e2e         # end-to-end tests

# Code quality
pnpm lint             # ESLint with auto-fix
pnpm format           # Prettier formatting

# Database migrations
pnpm migrate:latest   # run all pending migrations
pnpm migrate:up       # run next migration
pnpm migrate:down     # roll back last migration
pnpm migrate:list     # list migrations and their status
```

To run a single test file: `pnpm test -- path/to/file.spec.ts`

## Architecture

NestJS REST API with PostgreSQL (via Kysely query builder).

**Entry point** — `src/main.ts` bootstraps the app, loads dotenv, and calls `Database.getInstance().init()` to establish the database connection pool before the server starts listening.

**Database singleton** — `src/database/database.ts` wraps a Kysely + pg Pool instance. All database access goes through this singleton. In development (`NODE_ENV !== 'production'`) SQL queries and execution times are logged to stdout.

**Schema registry** — `src/database/schema.ts` contains the central `DatabaseSchema` interface. Every table interface is defined here and registered as a key on `DatabaseSchema`. Add a table interface here whenever a new migration creates a table.

**Migrator** — `src/database/migrator.ts` is a standalone CLI runner. Migration files live in `src/database/migrations/<model>-<timestamp>.migration.ts`. Kysely sorts them by filename, so the timestamp prefix enforces execution order.

**Base repository** — `src/database/base.repository.ts` is an abstract `BaseRepository<Model>` that all feature repositories extend. It provides typed `findAll`, `findBy`, `findOneBy`, `findById`, `findByIdOrThrow`, `count`, `create`, `update`, `delete`, and `withTransaction`. By default it applies soft-delete filtering (`deleted_at IS NULL`); set `protected readonly softDelete = false` to opt out.

**Module structure** — `src/modules/app.module.ts` is the root module importing `ConfigModule` globally. Feature modules live under `src/modules/<feature>/`.

## Module Structure

Every feature follows this exact file pattern under `src/modules/<feature>/`:

```
<feature>.module.ts       # NestJS module — wires controller, service, repository
<feature>.controller.ts   # Route handlers; uses ResponseHelper for all returns
<feature>.service.ts      # Business logic; calls repository; throws AppException subclasses
<feature>.repository.ts   # Extends BaseRepository<Table>; @Injectable()
<feature>.dto.ts          # class-validator DTOs for request bodies / query params / responses
<feature>.model.ts        # Kysely table interface; also registered in src/database/schema.ts
<feature>.constants.ts    # Domain string constants (error codes, status values, etc.)
```

Import conventions:
- Cross-module imports use the `src/` path prefix (e.g. `import { ResponseHelper } from 'src/common/helpers/response.helper'`).
- Imports within the same feature folder use relative `./` paths.

## Pagination

Paginated list endpoints follow this pattern:

```ts
// Controller
@Get()
async list(@Query() query: PaginationQueryDto) {
  return this.featureService.list(query);
}

// Service
async list({ page, limit }: PaginationQueryDto): Promise<ListResponse<FeatureResponseDto>> {
  const offset = PaginationHelper.toOffset(page, limit);
  const [items, total] = await Promise.all([
    this.featureRepo.findAll({ limit, offset }),
    this.featureRepo.count(),
  ]);
  const pagination = PaginationHelper.build({ page, limit, total });
  return ResponseHelper.list(items, pagination);
}
```

- Extend `PaginationQueryDto` (or compose it via `@Query()`) to accept `page` and `limit`.
- Use `PaginationHelper.toOffset(page, limit)` to convert to SQL offset.
- Use `PaginationHelper.build({ page, limit, total })` to build the `PaginationMeta`.
- Return `ResponseHelper.list(items, pagination)` — the `ResponseInterceptor` adds `links` automatically.

## Response Shapes

All controller methods must return a `ResponseHelper` value — never return raw objects:

| Helper | HTTP Status | Use when |
|---|---|---|
| `ResponseHelper.ok(data)` | 200 | Fetching / updating a single resource |
| `ResponseHelper.created(data)` | 201 | Creating a new resource |
| `ResponseHelper.noContent()` | 204 | Deleting a resource |
| `ResponseHelper.list(items, pagination)` | 200 | Paginated list |

The `ResponseInterceptor` wraps the response: `ok`/`created` → `{ data }`, `list` → `{ data: { items, pagination, links } }`.

## Swagger

Add Swagger annotations whenever you create or modify a controller or DTO:

- Tag controllers with `@ApiTags('<feature>')`.
- Document each endpoint with `@ApiOperation({ summary: '...' })`.
- Use `@OkResponseOf(Dto)`, `@CreatedResponseOf(Dto)`, `@ListResponseOf(Dto)` decorators (project-level factories that wrap `@ApiResponse`) on controller methods.
- Annotate every DTO property with `@ApiProperty()` or `@ApiPropertyOptional()`.
- Run `/update-swagger` after any API surface change to keep annotations in sync.

## Exceptions

Never throw `HttpException` directly. Always use the project's `AppException` subclasses from `src/common/exceptions/app.exception.ts`:

| Class | HTTP Status |
|---|---|
| `BadRequestException` | 400 |
| `UnauthorizedException` | 401 |
| `ForbiddenException` | 403 |
| `ResourceNotFoundException` | 404 |
| `ResourceConflictException` | 409 |
| `ValidationException` | 422 |
| `DatabaseException` | 500 |

The global `HttpExceptionFilter` translates the `errorCode` string to an i18n message before sending the response.

## Constants

No magic strings in business logic. All domain string literals (status values, role names, event names, error keys) go in `<feature>.constants.ts`:

```ts
// players.constants.ts
export const PLAYER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
```

## Naming Conventions

- **No generic variable names** — avoid `result`, `data`, `item`, `obj`, `res`. Name variables after what they represent: `player`, `matchId`, `paginatedPlayers`.
- **No domain prefix on service/repository methods** — write `findById`, not `findPlayerById`; the class name already carries the domain.
- **Avoid mutation** — prefer returning new values over mutating inputs.
- **Workflow readability** — method names should read like a workflow: `registerPlayer`, `recordMatch`, `calculateRanking`.
- **Column names** in the database use `snake_case`; TypeScript properties mirror them exactly.
- **Variables and function parameters** use `camelCase` in TypeScript code (e.g. `courtTotal`, `subsidyUsed`, `totalInternal`).

## API Key Convention

All API input (request body / query params) and output (response JSON) keys must be `snake_case` — this applies to DTOs, response interfaces, and any plain objects returned through `ResponseHelper`. `camelCase` is only for internal TypeScript variables and function parameters; it must never appear as a JSON key in the API contract.

```ts
// CORRECT — snake_case keys on the wire
return ResponseHelper.ok({
  user_snapshots: userSnapshots,
  total_cost: calculation.total_cost,
});

// WRONG — camelCase leaks into the JSON response
return ResponseHelper.ok({
  userSnapshots,              // ❌
  totalCost: calculation.totalCost,  // ❌
});
```

This rule also applies to pure internal types (e.g. calculation engine result types) when those types are directly included in a response — their fields must be `snake_case`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | — | Set to `production` to disable SQL logging |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `focus_tracker` | PostgreSQL database name |
| `DB_POOL_MAX_CONNECTION` | `10` | Connection pool size |

## Code Style

- Single quotes, trailing commas (enforced by Prettier)
- TypeScript strict mode enabled
- ESLint uses flat config (`eslint.config.mjs`) with `@typescript-eslint` and Prettier integration
- `@typescript-eslint/no-explicit-any` is disabled; floating promises and unsafe arguments are warnings
