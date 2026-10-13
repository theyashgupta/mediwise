# Continuous history audit (MEDI-69)

Goal: a user uploads every report they get, at any cadence, and trends, findings and Home stay correct and readable.

Audit on 2026-10-13. Method: read every place that compares reports or shows a date between reports, and ask what happens with the dense fixture. The fixture is one profile with 12 reports in 10 weeks: two full panels from two labs, nine glucose-only reports (two of them also measure HbA1c) and one day with two reports.

- Fixture: `packages/engine/fixtures/dense-history.json`.
- Loader for tests and seeds: `apps/api/src/db/dense-history.ts`. It runs the engine on each report, so the seeded rows match a real read.
- Seed: `pnpm --filter @mediwise/api db:seed-history <email> [last date]`. It moves the dates so the newest report falls on the last date (default today).
- End-to-end: `apps/e2e/tests/dense-history.spec.ts`.

## Assumptions found

Status: **Fixed** in this ticket, or **Ticket** with a draft in `docs/tickets/drafts/`.

| # | Where | Assumption | What went wrong with weekly reports | Fix | Test | Status |
| - | - | - | - | - | - | - |
| 1 | `docs/PRODUCT.md` Users | The user gets a yearly or half-yearly panel. | The product brief steered every screen to one report a year. | The user keeps every report, at any cadence. | Not code | Fixed |
| 2 | Engine findings, change title | Two reports are months apart, so a month and year name each value. | "94 mg/dL in Oct 2026, 112 mg/dL in Oct 2026" does not say which value came first. | Two dates in one month show the day: "on 6 Oct 2026". | `findings.test.ts` "two reports of one month name the day of each value" | Fixed |
| 3 | Engine findings, previous visit | The previous report measures the same panel. | A full panel after six glucose-only reports got no change finding for lipids, thyroid or vitamin D. | Each marker compares with its own last earlier value, at any interval. The API loads up to 12 earlier visits. DECISIONS.md Findings row updated. | `findings.test.ts` "a marker missing from the last report compares with its own last value", `dense-history.test.ts` | Fixed |
| 4 | Home score change | The report before the latest is a comparable panel. | A glucose-only report (score capped at 50) read as a drop of 30 or more from a full panel. | The change compares with the newest report of an earlier date on the same coverage cap (`sameScoreScale` in the engine). | `score.test.ts`, `dashboard.routes.test.ts` "the score change skips a narrow report" | Fixed |
| 5 | Home score change label | "since your visit of {date}" | A report is not always a visit. | "since your report of {date}". English and Hindi. | e2e "Home compares the score with the report of one week before" | Fixed |
| 6 | Home "Recent visits" | One report is one visit. | Same as 5. | "Recent reports". English and Hindi. | Copy only. `messages.test.ts` checks both languages | Fixed |
| 7 | Retest dates (MEDI-54) | The latest report holds every marker. | A glucose-only report hid the HbA1c retest date of the panel before it. | The date comes from each marker's newest value across all done reports. | `dashboard.routes.test.ts` "a marker the latest report did not measure keeps the retest date of its last value" | Fixed |
| 8 | Retest dates (MEDI-54) | A marker is measured once a year. | A marker measured last week still showed "Due on" a date a year away. | Home hides a marker measured in the last 30 days. | `report-age.test.ts` "a marker measured 30 days ago" | Fixed |
| 9 | Retest calendar file | The retest comes from the latest report. | The event text named the latest report's date, not the date of the value. | The event names the date the marker was measured. | `calendar-file.test.ts` "the description names the report that measured the marker" | Fixed |
| 10 | Family stale line (MEDI-51) | 365 days without a report is the only gap worth a note. | A person who tested every week and stopped for five months got no note. | A profile with a typical gap of 31 days or less reads as old after 90 days: "No report in the last 3 months." Others keep 365 days. The API returns the median gap of the newest 5 report dates. | `report-age.test.ts`, `dashboard.routes.test.ts` "a profile with weekly reports has a typical gap of 7 days" | Fixed |
| 11 | Trends, same-day reports | Reports of one date are one visit and only the newest value matters. | The other value of that day was dropped from the chart and the table. | The newest value draws the line. The other values ride along as `sameDay`, show in the tooltip and in the table. | `trends.routes.test.ts` "two reports with one collection date give one point" and "the 12-report fixture", `value-tooltip.test.tsx` | Fixed |
| 12 | Trend and marker charts, x axis | Points are evenly spaced visits. | One week and one year took the same width. | The x axis is a time axis. | e2e chart test | Fixed |
| 13 | Trend and marker charts, value labels | A chart has few points. | 12 labels in 10 weeks overlapped on a phone. | Labels keep a gap of a seventh of the time span, newest first. The tooltip shows every value. | `chart-window.test.ts`, e2e overlap check at 390 and 1440 px | Fixed |
| 14 | Trend and marker charts, x ticks | Same as 13. | Date ticks overlapped. | Recharts drops a tick that would overlap (`minTickGap`). Ticks show the day and month, and a 2-digit year when the view spans years. | e2e overlap check | Fixed |
| 15 | Trend and marker charts, range | The full range is always readable. | A weekly history after a yearly one packed the recent points together. | The chart opens on the last 90 days when they hold three points or more, else the full range. A "Last 90 days / All reports" switch shows when both views differ. | `chart-window.test.ts` | Fixed |
| 16 | Marker page history | Only one report per date. | On a date with two reports, the open report could lose its own point, so the page showed no change line. | The open report wins its own date. | `reports.routes.test.ts` "on a date with two reports, the marker page history keeps the point of the open report" | Fixed |
| 17 | Compare default pair | The report before `b` in the list is an earlier visit. | With two reports of one date, the default compared a report with its same-day twin. | Without `a`, the API takes the newest report of an earlier date. | `trends.routes.test.ts` "compare with b alone skips a report of the same date as b" | Fixed |
| 18 | Compare order | The user picks the older report as A. | Picking a newer A read every change backwards. | The API swaps a pair picked newest first. | `trends.routes.test.ts` "compare puts the older report first" | Fixed |
| 19 | Compare picker | Two pickers with few reports. | One report could sit on both sides. | Each picker disables the report the other side holds. Any two reports compare, at any distance. | `trends.routes.test.ts` "compare takes any two reports", e2e compare test | Fixed |
| 20 | Year in review score (MEDI-60) | Every report in the window is a full panel. | The score went "from 80 to 50" when the last report was glucose-only. | The score compares the first and last report on the broadest coverage cap in the window. | `year-review.routes.test.ts` "the score compares the broadest panels" | Fixed |
| 21 | Home latest report card | The latest report is the main panel. | After a glucose-only report, Home leads with a score capped at 50 and one marker. | Needs a product call on which report leads Home. | Not built | Ticket: [home-lead-report](../tickets/drafts/home-lead-report.md) |
| 22 | Doctor export, previous values | The report before holds the same panel. | After a glucose-only report, the export shows a previous value for glucose only. | Each marker shows its own last earlier value with its date. | `trends.routes.test.ts` "an earlier value is each marker's newest value from an earlier date, even two reports back" and "the second full panel of the 12-report fixture", `report-export.test.tsx` | Fixed (MEDI-72) |
| 23 | Compare picker labels | Two reports of one date come from two labs. | Two reports of one date from one lab have the same label. | Add the upload time or the file name to the label. | Not built | Ticket: [compare-picker-labels](../tickets/drafts/compare-picker-labels.md) |
| 24 | Repeat marker rule (MEDI-67, merged during this ticket) | A marker measured again within 30 days is a repeat or a second opinion. | Every weekly glucose point gets the dashed "repeat or linked" ring, and each weekly report can propose a link to the report before it. | MEDI-71, the maintainer chose both conditions: a 30-day repeat counts when the earlier value had watch or risk status, or when the profile's typical gap is longer than 30 days. A profile with fewer than three report dates counts as a long gap. `repeatsMarker` in `packages/engine` drives the trend ring and the marker settlement. | `sequence.test.ts` "repeatsMarker", `trends.routes.test.ts` "in the weekly 12-report fixture only rechecks of a watch or risk glucose value are linked" | Fixed |

## Checked and correct

- The year in review window ends at the latest report and starts 13 months before it. Weekly reports stay inside it. `measuredOnce` and `moved` read each marker's own points.
- Findings already used a strict earlier date (`<`), so a same-day report is never the previous visit.
- The trend list "change" is the last step of each series, at any interval. The label says "since the report before", which stays true.
- Recent reports on Home show 5 rows with an "All reports" link. Weekly users reach the rest from there.
- The engine status logic is unchanged. The new engine code is `sameScoreScale` and the findings look-back.

## Limits

- Findings load at most 12 earlier visits. A marker last measured more than 12 reports ago gets no change finding. Raise `earlierVisitLimit` in `findings.repo.ts` when the job time allows it.
- Home reads the newest 60 done reports to find a comparable score. A person with more than 60 narrow reports since the last full panel gets no score change.
- The stale rule uses two limits, 90 and 365 days. A cadence between monthly and yearly keeps 365 days.
