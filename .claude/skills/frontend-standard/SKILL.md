---
name: frontend-standard
description: Coding standard for apps/web (Vite, React 19, TanStack Router and Query, Tailwind v4, shadcn/ui). Use before you add or change a route, module, component, hook, form or data fetch in apps/web.
---

# Frontend standard

## When to use

- Before you write or change any file in `apps/web/src`.
- Read `.claude/rules/structure.md`, `naming.md`, `testing.md` and `comments.md` first. This skill does not repeat them.

## Structure

```
src/
  main.tsx           render only
  app/               router.ts, providers.tsx
  routes/            file routes; import a container, render it
  modules/<feature>/ components/ containers/ hooks/ api/ config/ types.ts index.ts
  common/            components/ hooks/ utils/ shared by modules
  components/ui/     shadcn, CLI only
  layouts/           AppShell, AuthLayout
  config/            env.ts, query-client.ts, route constants
  lib/               api.ts (Hono client), utils.ts (cn)
  styles/            globals.css (Tailwind tokens)
```

Data flows one way: `api/` to `hooks/` to `containers/` to `components/`. A route renders a container.

## How to add a module

1. Create `src/modules/<feature>/`. Use a kebab-case singular or plural noun that matches the API module (`reports`, `profiles`).
2. Add `api/<verb>-<noun>.ts` with one function per endpoint. Call `api` from `@/lib/api`, throw on `!res.ok`, return `res.json()`.
3. Add `hooks/use-<noun>.ts` with a TanStack Query hook that calls the `api/` function.
4. Add `components/<name>.tsx`: props in, JSX out. No hooks that fetch, no `api` import.
5. Add `containers/<name>-container.tsx`: call the hooks, pick loading, empty, error or data, pass props to components.
6. Add `types.ts` for types the module shares between its files, and `config/` for labels and constants.
7. Add `index.ts` that exports only what a route or another module needs (usually containers).
8. Add a route file that imports the container from `@/modules/<feature>` and renders it.
9. Add a test next to every file with logic.
10. Run `pnpm check`.

Copy `src/modules/health` as the starting point.

## How to add a route

1. Create the file under `src/routes/` (`reports/$reportId.tsx` for `/reports/:reportId`). The path is the URL.
2. Export `Route` from `createFileRoute` and set `component` to the container.
3. Import only from `@/modules/<feature>` (its `index.ts`) or `@/layouts`. Lint rejects anything else.
4. Read params in the container with `getRouteApi("/reports/$reportId").useParams()`. A module never imports a route file.
5. Do not edit `routeTree.gen.ts`. `pnpm dev` and `pnpm build` regenerate it.
6. Prefix a file or folder with `-` to keep it out of the route tree.

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ReportContainer } from "@/modules/reports";

export const Route = createFileRoute("/reports/$reportId")({ component: ReportContainer });
```

## How to fetch data

- Put the call in `api/`, the Query hook in `hooks/`. Containers call hooks; components never fetch.
- Use the Hono client from `@/lib/api`. Never hand-write a response type; infer it with `InferResponseType` from `hono/client` when a component needs it.
- Query keys: an array that starts with the module name, then ids: `["reports", reportId]`.
- Mutations use `useMutation` in `hooks/` and invalidate the module's keys on success.
- Never call Supabase or Postgres from the web for data. The web calls the API only.

```ts
export async function getReport(id: string) {
  const res = await api.reports[":id"].$get({ param: { id } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useReport(id: string) {
  return useQuery({ queryKey: ["reports", id], queryFn: () => getReport(id) });
}
```

## Loading, empty and error states

Every list view and every detail view renders all of these. A view that skips one is not done.

- Loading: a skeleton or spinner from `components/ui` while `isPending`.
- Empty: `EmptyState` from `common/components` with one sentence and the next action.
- Error: one sentence and a retry button that calls `refetch()`. Never show a raw error message or stack.
- Data: the view.

Decide the state in the container. Pass plain props to the component.

## How to add a shadcn component

1. Run from `apps/web`: `pnpm dlx shadcn@latest add <name>`.
2. Commit the generated file in `src/components/ui/` as the CLI wrote it.
3. Do not edit it by hand. To change behaviour, wrap it in `src/common/components/`.
4. Use only shadcn. Do not add another UI kit.

## Forms

- Use react-hook-form with `zodResolver` and a zod schema. Add `react-hook-form`, `@hookform/resolvers` and `zod` in the first ticket that builds a form, and name them in its report.
- Reuse the API's schema from `packages/shared` when one exists. Do not write a second schema for the same payload.
- Use the shadcn `form` components for fields, labels and messages.
- Submit through a `useMutation` hook. Disable the submit button while pending. Show server errors from the problem `title` and `detail`.

## Styling

- Tailwind classes only. No inline `style`, no CSS modules, no new CSS files.
- Colours, radii and fonts come from tokens in `src/styles/globals.css`. Never hard-code a hex value.
- Support light and dark. Use token classes (`bg-background`, `text-muted-foreground`), not raw colours.
- Merge classes with `cn` from `@/lib/utils`.

## TypeScript

- No `any`. Use `unknown` and narrow, or infer from the Hono client or a zod schema.
- No non-null `!` except on `document.getElementById("root")` in `main.tsx`.
- Props are a `type <Name>Props` above the component. No JSDoc on components or props.

## Copy

- Plain English for adults. No diagnosis language.
- Every report and marker view shows: "MediWise is for information, not diagnosis. It does not replace a clinician."

## Before you report done

- `pnpm check` passes from the repo root.
- No file breaks the import rules (lint enforces them).
- Every new list or detail view has loading, empty and error states.
