# Doctor export: show each marker's last earlier value

Goal: the doctor export shows a useful earlier value for each marker when the reports come at any cadence. Found in the continuous history audit (MEDI-69, item 22 in `docs/research/continuous-history.md`).

Today the export compares with one report, the newest report of an earlier date (`previousReport` in `apps/web/src/modules/reports/config/export.ts`). After a glucose-only report, only glucose has an earlier value.

Scope:

1. API: return, for each marker of a report, its newest value from an earlier date with that date and the lab name. Reuse the series from `listSeries` in the trends module.
2. Web: the export shows the earlier value and its date per row. Remove the single "Previous values are from" line, or keep it when every earlier value comes from one report.
3. Keep the change mark ("Higher now", "Lower now").

Rules: no Claude call, no new dependency. Copy per `.claude/rules/copy.md`, English and Hindi.

Acceptance:

- The export of the second full panel in the dense fixture shows earlier values from the first full panel, not blanks.
- A test covers a marker whose last value is two reports back.
- `pnpm check` passes.
