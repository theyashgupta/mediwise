# Retest due dates on Home, with a calendar file

Goal: a family sees when a retest is due and puts the date in the phone calendar. Dates come only from sourced intervals in the catalog. Rank 4 in `docs/research/features-2026-10.md`.

Scope:

1. Change `docs/PRODUCT.md` first. Move "reminders" out of the "Out of v1" list as "Retest due dates and a calendar file". Keep push, email and WhatsApp reminders out of v1.
2. Add an optional `retest` list to `markerSchema` in `packages/engine/src/catalog/schema.ts`. Each item has a status (`watch` or `risk`), a number of weeks and a source id from `sources.ts`.
3. Fill `retest` only for markers with a guideline source: HbA1c (`watch` 52 weeks, `risk` 13 weeks, ADA) and eGFR and urine ACR (`watch` and `risk` 52 weeks). The sources are in the intervals table of the research doc. Add another marker only with a guideline source you fetched, and list it in the PR.
4. API: return the due date of each marker on the latest `done` report of a profile: the report's `collected_at` plus the weeks for that marker's status. A report with no `collected_at` gives no date.
5. Web: add a "Due for retest" section on Home for the active profile. Each row shows the marker, the due date, and "Due since {date}" when the date is past. Show "Ask your doctor before you book a retest." once under the list.
6. Each row has an "Add to calendar" button. It downloads an `.ics` file with one all-day event: "Retest {marker} for {profile name}". The event text is "MediWise suggests this date from your report of {date}. Ask your doctor before you book a retest."
7. Hide the section when no marker has a due date.

Rules:

- No Claude call. No new runtime dependency. Write the `.ics` text with a small pure function that follows RFC 5545 (CRLF lines, `UID`, `DTSTAMP`, `DTSTART;VALUE=DATE`).
- The engine stays pure. It does not read the clock. Due dates are dates. The web compares them with today.
- A marker without `retest` keeps today's follow-up text and gets no date. Do not change the "8 to 12 weeks" follow-up text in this ticket.
- The copy suggests a date. It never says the user must test. Keep the hedge, per `.claude/rules/copy.md`.
- Built to follow DPDP: the `.ics` file stays on the user's device. MediWise stores no reminder.

Acceptance:

- A catalog test passes: every `retest` item names a source that exists.
- A test passes for the due date: a `watch` HbA1c from 1 Feb 2025 is due 31 Jan 2026.
- A test of the `.ics` function passes, and the file opens in Google Calendar and Apple Calendar. Write the check in the PR.
- Home shows the section in light, dark and phone. Add the screenshots to `docs/design/pages` and a row to the Pages table in `docs/DESIGN.md`.
- `pnpm check` passes.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
