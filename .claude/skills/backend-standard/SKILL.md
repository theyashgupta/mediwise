---
name: backend-standard
description: Coding standard for apps/api (Hono on Node, zod, Drizzle, in-process job worker). Use before you add or change a route, service, repo, schema, migration, middleware or job in apps/api.
---

# Backend standard

## When to use

- Before you write or change any file in `apps/api/src`.
- Read `.claude/rules/structure.md`, `naming.md`, `testing.md` and `comments.md` first. This skill does not repeat them.

## Structure

```
src/
  index.ts            bootstrap only
  app.ts              mounts module routes, error handlers, exports AppType
  modules/<feature>/  <feature>.routes.ts .service.ts .repo.ts .schemas.ts index.ts
  common/             errors.ts (AppError), problem.ts, validate.ts, pagination.ts
  middleware/         auth.ts, request-id.ts, logger.ts
  db/                 client.ts, schema.ts, migrations/
  config/             env.ts, constants.ts
  lib/                supabase.ts, anthropic.ts, storage.ts
  jobs/               worker.ts, <name>.job.ts
```

Calls flow one way: routes to service to repo. Routes never touch Drizzle. Services never touch Hono.

## How to add a module

1. Create `src/modules/<feature>/`. Use the plural resource name (`reports`, `profiles`).
2. Add `<feature>.schemas.ts` with zod schemas for params, query and body. If the web also needs a schema, put it in `packages/shared` instead.
3. Add `<feature>.repo.ts` with Drizzle queries. One exported function per query.
4. Add `<feature>.service.ts` with business logic. It calls the repo and throws `AppError` for expected failures.
5. Add `<feature>.routes.ts`: `export const <feature>Routes = new Hono()` with chained, inline handlers that validate input and call the service. Pass the env type that `middleware/auth.ts` exports (MEDI-3) so `c.var.userId` is typed.
6. Add `index.ts` that exports `<feature>Routes` and anything another module needs.
7. Mount it in `app.ts` with `.route("/<feature>", <feature>Routes)` inside the existing chain, so `AppType` keeps the types.
8. Add tests: routes through `<feature>Routes.request()`, services with a stubbed repo only where the database is the edge.
9. Run `pnpm check`.

Copy `src/modules/health` as the starting point.

## Routes

- Write handlers inline after the path. Do not write controller functions; they lose type inference.
- Chain every route on one `Hono` instance. Breaking the chain drops routes from `AppType` and the web client.
- Return `c.json(data)` for success, with the status as the second argument when it is not 200.
- Every route sits behind the `auth` middleware and reads `c.var.userId`. Public routes: `/health`. Add a route to this list only with the maintainer's approval.
- Scope every query by the user: pass `c.var.userId` to the service and filter by owner in the repo.

## How to validate

- Validate every param, query and body with `validate(target, schema)` from `common/validate.ts`. No route reads `c.req.json()` or `c.req.param()` directly.
- Read the result with `c.req.valid(target)`.
- A failure answers 400 with a problem body. You do not write that code.

```ts
export const reportsRoutes = new Hono()
  .get("/:id", validate("param", reportParamsSchema), async (c) => {
    const { id } = c.req.valid("param");
    return c.json(await getReport(c.var.userId, id));
  })
  .post("/", validate("json", createReportSchema), async (c) => {
    return c.json(await createReport(c.var.userId, c.req.valid("json")), 201);
  });
```

## How to return errors

- Every error response is RFC 9457 problem details: `{ type, title, status, detail? }` with `Content-Type: application/problem+json`.
- In a service: `throw new AppError(404, "Report not found")`. `handleError` in `common/problem.ts` turns it into the response.
- In a route or middleware: `return problem(c, 403, "Forbidden", "optional detail")`.
- Unknown errors become a bare 500 and are logged. Never put a stack, SQL or a secret in `title` or `detail`.
- Do not catch an error only to rethrow or log it. Let it reach `handleError`.

## How to write a repo function

- One exported async function per query, named for what it returns: `findReportById`, `listReportsByProfile`, `insertReport`.
- Take plain arguments, return plain rows or `undefined`. No business rules, no `AppError`, no Hono.
- Import `db` from `src/db/client.ts` and tables from `src/db/schema.ts`.
- Filter by owner in the query itself (join `profiles` on `owner_user_id`), never after loading rows.
- Select the columns you need. Use a transaction (`db.transaction`) when you write more than one table.

```ts
export async function findReportById(ownerUserId: string, id: string) {
  const [row] = await db
    .select({ id: reports.id, status: reports.status })
    .from(reports)
    .innerJoin(profiles, eq(profiles.id, reports.profileId))
    .where(and(eq(reports.id, id), eq(profiles.ownerUserId, ownerUserId)));
  return row;
}
```

## How to add a migration

1. Edit `src/db/schema.ts`.
2. Run `pnpm --filter @mediwise/api db:generate` and read the generated SQL in `src/db/migrations/`.
3. Run `pnpm --filter @mediwise/api db:migrate` against the dev database.
4. Commit the schema change and the migration together. Never edit a migration that is merged; add a new one.
5. If a migration drops or renames a column, stop and ask the maintainer first.

## How to add a job handler

1. Create `src/jobs/<name>.job.ts` exporting `async function handle<Name>(payload)`. Parse the payload with a zod schema first.
2. Register it by job kind in `src/jobs/worker.ts`.
3. Make it idempotent: a retry (up to 3 attempts) must not duplicate rows or files.
4. Call services for the work. A job holds no business logic and no Drizzle queries of its own.
5. Throw on failure; the worker records the error and retries.
6. Test the handler directly with a payload. Do not start the worker in tests.

## Logging and config

- Log only through `log` from `src/middleware/logger.ts`. `console` is a lint error everywhere else.
- Never log a token, a key, a file's contents or extracted health values.
- Read env only through `env` from `src/config/env.ts`. Add each new variable to its zod schema and to `.env.example`.

## TypeScript

- No `any`. Infer from zod (`z.infer`) and Drizzle (`typeof table.$inferSelect`).
- Import local files with a `.js` extension (NodeNext).

## Before you report done

- `pnpm check` passes from the repo root.
- Every new route validates its input and sits behind `auth` unless listed public.
- Every new error path returns a problem body.
