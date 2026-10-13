# MEDI-3 (revised 2026-10-11): Supabase project, Drizzle schema, storage bucket, dev owner. No auth yet.

This file replaces the Dispatch description of MEDI-3. Auth moved to MEDI-18.

## Goal

The API talks to a real Supabase Postgres through Drizzle, has a private storage bucket, and every route reads `c.var.userId` from one middleware. In this ticket that middleware returns a fixed dev user. MEDI-18 swaps it for JWT verification without touching any route.

## Depends on

MEDI-2.

## Setup

- Use the Supabase MCP server to create one project named `mediwise-dev` (region Mumbai, `ap-south-1`). If the MCP is not authenticated, stop and ask the maintainer to run `/mcp` and log in.
- Variables, api: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `DEV_USER_ID` (default `dev-user`). Web: `VITE_API_URL`. Add every one to `.env.example`. Ask the maintainer to fill `.env` files. Never read them.

## Scope

1. `apps/api/src/db/schema.ts` with Drizzle: tables `profiles`, `reports`, `report_files`, `report_markers`, `follow_ups`, `jobs`, `marker_alias_suggestions` as sketched in `docs/PRODUCT.md`. `profiles.owner_user_id` is `text not null`. Indexes on `profiles.owner_user_id`, `reports.profile_id`, `report_markers.report_id`, `jobs.status`. `drizzle.config.ts`, scripts `db:generate`, `db:migrate`, `db:studio`. Generate and apply the first migration.
2. `apps/api/src/middleware/auth.ts`: sets `c.var.userId = env.DEV_USER_ID`. One file, with a JSDoc that says MEDI-18 replaces the body with JWT verification. Apply to every route except `/health`.
3. `apps/api/src/modules/me`: `GET /me` returns `{ userId }`.
4. `apps/api/src/lib/supabase.ts`: admin client with the service role key. `apps/api/src/lib/storage.ts`: `createSignedUploadUrl`, `createSignedDownloadUrl`, `list`, `remove` for bucket `reports`. Create the bucket (private) in the migration script or a `db:seed` script.
5. Web: `src/lib/api.ts` Hono client with `VITE_API_URL`. No auth pages. No session hook. The index route calls `GET /me` and shows the user id.

## Out of scope

- No login, signup, or password flows. No supabase-js in the web app. MEDI-18.
- No profiles UI. MEDI-5.
- No app shell. MEDI-4.

## Acceptance criteria

- `pnpm db:migrate` creates the tables and is idempotent on a second run.
- `curl $VITE_API_URL/me` returns `{ "userId": "dev-user" }`.
- A signed upload URL from `storage.ts` accepts a PUT of a small file, and `list` shows it.
- `pnpm check` passes.
