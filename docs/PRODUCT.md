# MediWise Health - Product

## One line

Upload any lab report. MediWise extracts every marker, explains it in plain language, scores it against ranges calibrated to age, sex and ancestry, and tracks it across reports for you and your family.

## Users

- Primary: an adult anywhere who gets a lab report as a PDF, a photo or a portal screenshot and wants every report in one place, at any cadence: a yearly panel, a monthly thyroid test or a weekly glucose test. They want to understand each one without a doctor visit. India is the first market.
- Secondary: the same person managing reports for parents, partner and children (family profiles).
- Not in v1: doctors, labs, employers.

## What the old MediWise had (April 2025, three repos, Lovable + NestJS)

- Frontend was mock only. No API client, no auth state.
- Backend accepted PDF or image, stored in MinIO, parsed PDF text (no OCR), sent text to GPT-4 in one prompt that extracted values, invented a 0-100 score, and wrote recommendations. No schema validation. No auth. No user on a report.
- Pricing idea in INR per month: Basic 499 (1 profile, 50 reports), Family 899 (4 profiles, 200 reports), Premium 1499 (8 profiles, unlimited).

## Competitor reference: Depth (app.depth.fit), explored 2026-10-11

Depth is single person, blood only, web is a slice of their iPhone agent. What they do well and we copy:

- The LLM only extracts values. A deterministic engine with a marker library decides status, score and follow-ups. Same report gives the same score.
- Score 0-100 with tiers (Apex, Platinum, Gold, Silver, Bronze). A thin panel caps the score ("14 of 16 core markers").
- Report page: one-sentence verdict, ranked "move first" list, markers grouped by body system, each with a one-line description. Tabs: Markers, Follow-ups (typed Retest / Supplement / Measure), Unmeasured (high-value markers the panel skipped).
- Marker page: lab range and calibrated range on one bar, trajectory across draws, "What it is / Why it matters / What moves it", a South Asian calibration note with cited sources.
- Derived ratios (ApoB/ApoA1, TC/HDL, AST/ALT, BUN/Creatinine) computed from the panel.
- Honest copy: "informational, not a diagnosis", "nothing invented", sources listed.

Gaps we fill:

- Family profiles. One account, many people, each with their own reports and trends.
- Any lab report, not only blood (urine, thyroid, vitamin panels, lipid-only reports).
- Report-to-report comparison and trends from the first two uploads.
- A doctor-ready export of a report.
- No marker shows "unknown" as its description. Every marker in the library has copy.
- The score formula is explained on the page.

## MVP scope (v1)

In:

1. Auth: email + password and Google, via Supabase Auth.
2. Profiles: self plus family members. Fields: name, relation, date of birth, sex, ancestry.
3. Upload: one PDF (up to 25 MB) or up to 10 photos (4 MB each) per report, per profile.
4. Extraction: Claude reads the file(s) and returns structured values. Values map to the marker library by alias.
5. Engine: status per marker (optimal, watch, risk), overall score and tier, panel coverage cap, move-first ranking, derived ratios, follow-ups, unmeasured list.
6. Dashboard: active profile, latest report, needs attention, reports list.
7. Report page, marker page, trends across reports, comparison of two reports.
8. Settings: account, self profile, delete report, sign out.
9. Doctor export: printable summary of one report.
10. Deploy: web on Cloudflare Pages, API on Render free, Supabase hosted (see DECISIONS.md).
11. Retest due dates and a calendar file: a due date for markers with a sourced retest interval, and an `.ics` file the user adds to the phone calendar. MediWise stores no reminder.
12. Questions about your own reports: a person asks about the reports of one profile and gets 1 to 5 sentences that cite the report and date of every number. The assistant explains. It does not diagnose, treat or reassure (see `docs/research/assistant.md`).
13. Suggestions for each profile: habits, retests, supplements to ask about and see-a-doctor flags. The engine makes them from the catalog by fixed rules, and each one carries the disclaimer "MediWise is for information. Ask your doctor before you act on this."
14. Home is the health overview of a profile. First it shows what needs attention, see a doctor and patterns across reports. Next come retests due, and habits and questions for your doctor. The latest report card comes after them. Each block names where its data comes from and links to the detail.

Out of v1 (do not build, do not scaffold):

- Medications, vitals, push, email and WhatsApp reminders, home blood draw booking, story recap, payments and plans, landing page, iOS app.

## Screens

- `/login`, `/signup`, `/forgot-password`
- `/` dashboard
- `/profiles` manage family members
- `/reports/upload`
- `/reports/:id` report page (tabs: markers, follow-ups, unmeasured)
- `/reports/:id/markers/:markerKey` marker page
- `/trends` and `/trends/:markerKey`
- `/compare?a=<reportId>&b=<reportId>`
- `/settings`

## Data model (sketch, final shape lives in `apps/api/src/db/schema.ts`)

- `profiles`: id, owner_user_id, name, relation, date_of_birth, sex, ancestry, is_self, created_at
- `reports`: id, profile_id, status (queued, processing, done, failed), lab_name, collected_at, reported_at, source_kind (pdf, photos), score, tier, coverage, verdict, error, created_at
- `report_files`: id, report_id, storage_path, mime, size, page_index
- `report_markers`: id, report_id, marker_key (nullable when unmapped), raw_name, value, unit, lab_range_low, lab_range_high, status, calibrated_low, calibrated_high, note
- `follow_ups`: id, report_id, kind (retest, supplement, measure), marker_key, title, why, next_action, rank
- Marker library is code in `packages/engine`, not a table, so it ships with the app and is versioned with git.

## Engine principles

- Pure TypeScript, no I/O, no dates from the clock. Input: profile (age, sex, ancestry) plus extracted markers. Output: statuses, score, tier, coverage, ranking, ratios, follow-ups, unmeasured.
- Same input, same output. Tests pin fixtures.
- Every range in the library carries a source. Every marker carries: key, display name, aliases, category, canonical unit, unit conversions, description (one line), what it is, why it matters, what moves it, calibration note for South Asian ancestry, sources.
- Core markers list (about 16) drives the coverage cap.

## Tone

Plain English written for adults. No diagnosis language. Always show the disclaimer "MediWise is for information, not diagnosis. It does not replace a doctor."
