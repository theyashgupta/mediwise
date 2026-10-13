# MediWise

Upload a lab report, get every marker explained, scored and tracked. Turborepo + pnpm monorepo, Node 24, pnpm 11.

## Repo map

- `apps/api` - Hono on Node, port 3001. `src/app.ts` mounts modules and exports `AppType`.
- `apps/web` - Vite, React 19, TanStack Router and Query, Tailwind v4, shadcn/ui, port 5173. `src/lib/api.ts` is the Hono client typed with `AppType`; never hand-write API response types.
- `packages/shared` - zod schemas and types shared by web and api.
- `packages/config` - shared `tsconfig.base.json`, ESLint flat config, Prettier config.

## Commands

- `pnpm dev` - api and web together. `pnpm build`, `pnpm format`.
- `pnpm check` - typecheck, lint and test. Run it before you report done.
- 8 GB RAM: never run `pnpm check` and `pnpm dev` at the same time.
- `pnpm eval:mapping` - maps the printed test names of every PDF in `~/Work/mediwise-samples` by alias. No Claude call, no cost.
- `pnpm eval:extraction [sample.pdf]` - runs the real read pipeline on the made-up samples in `apps/api/fixtures/golden` and on the real ones in `~/Work/mediwise-samples/golden` (never in the repo), and prints each difference and the cost. It calls Claude and stops before it can pass $1. Never run it in CI.
- `pnpm eval:findings [runs] [model] [reportId]` - writes the findings of every done report in the database `runs` times (default 3) and prints the first-try pass rate, the rejection reasons, the findings cost and whether each run kept the same set. It reads stored visits, so it pays for no extraction. It calls Claude and stops past $1. Never run it in CI.
- `pnpm eval:assistant [runs] [model] [question numbers]` - runs the 30 red-team questions of `docs/research/assistant.md` on two made-up profiles built in memory, `runs` times (default 3), and prints the pass rate per question, the first-try rate, the rule names, the cost and the measured context size. It needs no database. It calls Claude and stops past $1. Never run it in CI.
- `pnpm eval:narrative [runs] [sample.pdf]` - reads the two made-up samples and the real ones listed in `~/Work/mediwise-samples/narrative.json` once, writes each narrative `runs` times (default 3) and prints the first-try pass rate, the rejection reasons and the narrative cost. It calls Claude and stops past $1. Never run it in CI.

## Read before you write code

- `docs/PRODUCT.md` (what is in and out of v1), `docs/DECISIONS.md` (do not change a decision inside a ticket), `docs/tickets/NOTES.md` (overrides ticket text).
- Rules, always: `.claude/rules/structure.md`, `naming.md`, `testing.md`, `comments.md`, `copy.md` (user-facing text follows `.claude/skills/asd-ste100`).
- Skills: `.claude/skills/frontend-standard` for `apps/web`, `.claude/skills/backend-standard` for `apps/api`.
- Copy `modules/health` in either app to start a new module.

## Personal data

- Never commit a real report, name, value, lab name or doctor name. Tests and fixtures use made-up data.
- Screenshots and recordings use the demo account `arjun.demo@example.com` on `mediwise-dev`. It holds the two sample reports in `apps/api/fixtures/golden` (profile Arjun Mehta) and the five reports in `apps/api/fixtures/episode` (made-up partner profile Meera Mehta). Its password is `MEDIWISE_DEMO_PASSWORD` in the env-vault. Never capture the dev profile or a real report.
