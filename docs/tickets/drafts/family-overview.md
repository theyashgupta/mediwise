# Family overview on Home: one row per profile, with the latest report and its age

Goal: the person who manages the family's reports sees every profile on Home in one list. A profile with no recent report is easy to see. Rank 1 in `docs/research/features-2026-10.md`.

Scope:

1. API: add `GET /dashboard/family` to the dashboard module. It returns one row per profile of the user: profile id, name, relation, and the latest report with status `done` (id, date, score, tier, number of markers at risk). The date is `collected_at`, or `reported_at` when `collected_at` is empty. Read each table once for all profiles, not once per profile.
2. Web: add a "Your family" section on Home, below the latest report card. Use the Rows pattern in `docs/DESIGN.md`: one card, one row per profile, the score in `font-mono` on the right.
3. Each row shows the name, the relation, the date of the latest report, the score and tier, and "{n} markers at risk" with the risk status mark. Hide the risk line when the count is 0.
4. A profile whose latest report is more than 365 days old shows "No report in the last 12 months." A profile with no report shows "No report yet." and an "Upload a report" link.
5. A row makes that profile the active profile and stays on Home. The "Upload a report" link makes the profile active, then opens `/reports/upload`.
6. When the user has only the self profile, the section shows "Add family members to see their reports here." and an "Add a family member" link to `/profiles`.

Rules:

- No Claude call. No new runtime dependency. No change to the engine.
- The 365-day rule uses today's date in the web app. The API returns dates only. Put the rule in one pure function with a test.
- The stale line names a date, not a medical need. Do not write "overdue" or "you should test".
- Copy follows `.claude/rules/copy.md` and the names in `docs/copy-audit.md` ("family member", "report", "marker").
- Status colours mark the risk count only, per `docs/DESIGN.md`. The stale line uses `text-muted-foreground`.
- Build with the components in `docs/DESIGN.md` on the day you start. MEDI-47 may change them.

Acceptance:

- An API route test with three profiles passes: one with two reports, one with no report, one with a report older than 365 days. Each row has the right latest report and risk count.
- A test of the stale rule passes for 364, 365 and 366 days.
- Home shows the section in light and dark at 390, 1440 and 1920 px with no sideways scroll. Add the screenshots to `docs/design/pages` and a row to the Pages table in `docs/DESIGN.md`.
- `pnpm check` passes.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
