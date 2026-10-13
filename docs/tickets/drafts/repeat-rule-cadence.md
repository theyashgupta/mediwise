# Repeat marker rule: fit a weekly history

Goal: a person who tests every week does not see every report marked as a repeat. Found in the continuous history audit (MEDI-69, item 24 in `docs/research/continuous-history.md`).

MEDI-67 marks a marker measured again within 30 days as a repeat (`repeatMarkerDays` in `packages/engine`). The trend chart draws a dashed ring on each such point, and the link detector can propose a link between the two reports. With the dense fixture (12 reports in 10 weeks), every glucose point has the ring.

Scope:

1. Decide with the maintainer when a 30-day repeat counts as a link. Options: only when the earlier value had watch or risk status, or only when the profile's typical gap between reports is longer than 30 days (`typicalGapDays` in the dashboard service).
2. Apply the rule in the trends series (`linked`) and in the link detector (`apps/api/src/modules/links/links.service.ts`).

Rules: no Claude call, no new dependency, the engine status logic unchanged.

Acceptance:

- The glucose trend of the dense fixture shows no repeat ring on a weekly optimal value.
- A repeat of a risk value within 30 days keeps its ring, as MEDI-67 tests it.
- `pnpm check` passes.
