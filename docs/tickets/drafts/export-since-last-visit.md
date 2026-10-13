# Doctor export: show the previous value of each marker

Goal: the doctor export answers "was it higher last time?" on the same page. Each marker shows its value from the profile's previous report. This is the pre-visit summary from MEDI-43, rank 3 in `docs/research/features-2026-10.md`.

Scope:

1. On `/reports/$reportId/export`, find the previous report of the same profile. Use the rule of the dashboard score change in `apps/api/src/modules/dashboard/dashboard.service.ts`: the latest `done` report with an earlier date, skipping a report with the same collection date.
2. Get the paired values from the compare API (`compareRoutes`, `GET /compare?a=<previous>&b=<this>`). Add an endpoint only when compare cannot give the pairing, and write why in the PR.
3. Add a "Previous" column to the Move first table and the Markers table. It shows the previous value in the current unit and a mark for up or down. The mark has a text label for screen readers.
4. Under the profile block, add one line: "Previous values are from {lab}, {date}."
5. When there is no previous report, show no column and no line. When a marker is not on the previous report, leave its cell empty.

Rules:

- No Claude call. No new runtime dependency. No change to the engine.
- Show the printed values only. Do not add a word that judges the change, such as "better" or "worse".
- A previous value in a different unit shows only when the engine converts it to the current unit. Otherwise leave the cell empty.
- The export stays black on white in both themes and in print, per `docs/DESIGN.md`.
- Copy follows `.claude/rules/copy.md`.

Acceptance:

- A test passes for the previous-report rule: two reports on the same date, a third on an earlier date. The earlier one is the previous report.
- The export of the demo report "Sunrise Diagnostics, 29 Mar 2025" shows the values from 9 Mar 2024. The export of the first report shows no column.
- The printed page fits A4 portrait with the new column. Add light, dark and phone screenshots to `docs/design/pages` and update the Doctor export row in `docs/DESIGN.md`.
- `pnpm check` passes.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
