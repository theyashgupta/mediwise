# Compare: tell apart two reports of one date from one lab

Goal: a person with two reports of one date from one lab can pick the right one on the compare page. Found in the continuous history audit (MEDI-69, item 23 in `docs/research/continuous-history.md`).

Today each picker option shows the date and the lab name (`reportLabel` in `apps/web/src/modules/trends/components/compare-picker.tsx`). Two reports of one date from one lab show the same text.

Scope:

1. Add the file name of the first file to the compare report header in `apps/api/src/modules/trends/trends.service.ts` (`reportFileNames` from the reports module).
2. Show the file name in the option when two options would have the same text.

Rules: no new dependency. Copy per `.claude/rules/copy.md`.

Acceptance:

- Two reports of one date from one lab show two different labels.
- A test of the label function covers the case.
- `pnpm check` passes.
