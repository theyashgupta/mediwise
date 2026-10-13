# Structure

One folder structure per app. ESLint enforces the import rules, so `pnpm lint` fails when a file breaks them.

## Why this structure

- Web follows bulletproof-react: feature folders, one-way imports (shared to modules to routes), enforced with `import/no-restricted-paths` zones. We add a `containers/` split so components stay pure, and TanStack file routes stay thin.
- Divergence: bulletproof-react no longer recommends barrel files. We keep one `index.ts` per module as its public API. Keep it narrow: export only what another module or a route needs.
- API follows Hono's best practices: one `Hono` instance per module, handlers written inline after the path (no controller functions, they lose type inference), mounted with `app.route()` and chained so `AppType` carries every route to `hc`. Business logic and Drizzle sit behind it in `service` and `repo` files.

## Web: `apps/web/src`

```
main.tsx            render only.
app/                router.ts, providers.tsx
routes/             TanStack file routes. A route file only imports a container and renders it.
modules/<feature>/
  components/       presentational. Props in, JSX out. No data fetching.
  containers/       wire hooks to components. Routes render containers.
  hooks/            TanStack Query hooks and local hooks for this feature.
  api/              typed calls through the Hono client for this feature.
  config/           constants, labels, enums for this feature.
  types.ts
  index.ts          the only file other modules may import from.
common/
  components/       reusable components that are not shadcn (EmptyState, PageHeader, StatusBadge).
  hooks/
  utils/
components/ui/      shadcn generated. Edit only through the shadcn CLI.
layouts/            AppShell, AuthLayout.
config/             env, route path constants, query client.
lib/                api client, supabase auth client.
styles/             globals.css with the Tailwind tokens.
```

Create a module subfolder only when it has a file. `modules/health` is the reference.

## API: `apps/api/src`

```
index.ts            bootstrap only.
app.ts              assembles routes, error handlers, exports AppType.
modules/<feature>/
  <feature>.routes.ts    Hono routes. Validate with zod. No business logic.
  <feature>.service.ts   business logic. No Hono types.
  <feature>.repo.ts      Drizzle queries. No business logic.
  <feature>.schemas.ts   zod schemas for this module. Shared ones live in packages/shared.
  index.ts
common/             errors.ts (AppError), problem.ts (error responses), validate.ts, pagination.ts
middleware/         auth.ts, request-id.ts, logger.ts
db/                 client.ts, schema.ts, migrations/
config/             env.ts, constants.ts
lib/                supabase.ts, anthropic.ts, storage.ts
jobs/               worker.ts and one file per job handler.
```

Create a file only when it has content. `modules/health` is the reference.

## Import rules

Web (`apps/web/eslint.config.js`):

- A module imports from its own folder, `common`, `components/ui`, `lib`, `config`, and another module's `index.ts` only.
- A module never imports `routes`, `layouts` or `app`.
- `routes/` imports only `modules/*/index.ts` and `layouts`. Packages such as `@tanstack/react-router` are allowed.
- `common`, `components`, `lib` and `config` never import `modules`, `routes`, `layouts` or `app`.

API (`apps/api/eslint.config.js`):

- A module imports another module only through its `index.ts`, and never imports `app.ts`, `index.ts` or `jobs/`.
- `*.routes.ts` never imports `drizzle-orm` or a `*.repo` file. Routes call services.
- `*.service.ts` never imports `hono` or `@hono/*`. Throw `AppError` instead.

Both apps:

- `no-console` is an error. The API logs only through `src/middleware/logger.ts`.
- Use the `@/` alias (web) or a relative `.js` path (api) across folders.
