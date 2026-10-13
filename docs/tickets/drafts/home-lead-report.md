# Home: pick the report that leads the latest report card

Goal: a person who sends a glucose-only report every week still sees a useful score on Home. Found in the continuous history audit (MEDI-69, item 21 in `docs/research/continuous-history.md`).

Today the latest report card shows the newest done report. After a glucose-only report, Home leads with a score capped at 50, one marker and a coverage of 6%. The full panel from last month is one click away.

Scope:

1. Decide with the maintainer which report leads Home. Options: the newest report, the newest report on the broadest coverage cap, or both (the newest full panel on top and a "Since then" row for the narrow reports).
2. Change `getDashboard` in `apps/api/src/modules/dashboard/dashboard.service.ts` and `LatestReportCard` to match. Use `sameScoreScale` from `@mediwise/engine` for "broadest".
3. Keep "Needs attention" on the same report as the card.

Rules: no Claude call, no new dependency, the engine status logic unchanged. Copy per `.claude/rules/copy.md`, English and Hindi.

Acceptance:

- The dense fixture (`pnpm --filter @mediwise/api db:seed-history <email>`) shows the chosen report on Home at 390, 1440 and 1920 px.
- An API route test covers a narrow latest report after a full panel.
- `pnpm check` passes.
