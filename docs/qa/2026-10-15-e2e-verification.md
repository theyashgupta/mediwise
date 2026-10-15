# End-to-end verification since MEDI-96 (MEDI-171)

Date: 2026-10-15. Base: the MEDI-96 merge `edbb85c`. Head: the MEDI-169 merge `6c915b7`.

## 1. Feature list

Source: `git log --merges --first-parent edbb85c..6c915b7`, filtered to merges that change `apps/web`, `apps/api`, `apps/landing` or `packages/engine`. The done condition of each row comes from the card on the Dispatch board (`GET http://localhost:4710/api/cards?board=MEDI`).

Skipped merges:

- MEDI-101 to MEDI-147 (demo videos, the narration scripts, the README and the ad). These merges change no file in the four app paths. MEDI-102, 104, 106, 108 and 110 to 123 are demo videos, not features.
- MEDI-154 (supply-chain scan): CI only.
- Direct commits on main (bundle size baselines, README lines): no app behaviour.

| Ticket | Feature | Done condition (one line) |
|:-|:-|:-|
| MEDI-77 | Ask page, citation chips, review month | `/ask?report=<id>` answers with chips per sentence, a chip opens a fact card (right column at 1280 px, bottom sheet below), quota states show, "This answer is wrong" and "Clear chat" work. |
| MEDI-97 | Landing 404 and serif font | `/does-not-exist` and `/hi/does-not-exist` render the styled 404 in the right language, and `/hi` makes no request for the unused serif file. |
| MEDI-98 | Unit test timeouts under load | `pnpm check` passes on a loaded machine; slow tests declare their timeout. Test-only, graded by `pnpm check`. |
| MEDI-99 | Assistant follow-up tests | The Home back-navigation scroll test, the settled-finding dashboard test and the rare chip kinds test exist and pass. Test-only, graded by `pnpm check` and a live back-navigation check. |
| MEDI-100 | Coverage thresholds | Web and landing thresholds sit at measured minus 10. Config-only, graded by `pnpm check`. |
| MEDI-148 | Button family and placements | Buttons read as one family, one primary per view, Link reports on the baseline of the Report and Kind selects, no "Claude" in any rendered string. |
| MEDI-149 | Operator page, credits only | `/admin` shows credit history in rupees only (no dollar sign, no Claude spend), failed reads at the bottom; a non-admin gets the not-found page and an API 404. |
| MEDI-150 | Mascot component | An SVG droplet mascot with idle, listening, thinking and talking states, no motion under reduced motion, shown in the design gallery. |
| MEDI-151 | Ask floating widget | The mascot launcher shows on every signed-in page when the assistant is on, opens a 400 x 600 panel on desktop and a full-height sheet on phones, Escape closes it, focus stays in it. |
| MEDI-152 | Floating glass tab bar | On phones the bottom bar floats with a glass surface, hides on scroll down, shows on scroll up, never covers content or a dialog. |
| MEDI-153 | Legal details | `/contact` and the policy pages show the business name, proprietor, email, phone in +91 form and address; every footer reads "MediWise is a brand of CodeGenics"; Settings has an About block. |
| MEDI-155 | Home attention list across reports | Home lists every watch or risk marker and every worsening marker across all reports, once each, ordered risk, worsening, watch, with chips All, Worsening, Risk, Watch. |
| MEDI-156 | Report page summary band and sections | The report page opens with a summary band (score ring, verdict, move first) and collapsible sections with counts; Studies and marker groups fold; nothing is lost. |
| MEDI-157 | Trends filters and Keep an eye on | Trends has combinable direction and status chips kept in the URL, a Keep an eye on block, and one rule-based suggestion per trend that ends with the doctor line. |
| MEDI-158 | Suggestions engine and API | `GET /profiles/:id/suggestions` returns rule-based suggestions, each with the disclaimer, no dosage, no medicine name, no Claude call. |
| MEDI-159 | Home as the health overview | Home shows Needs attention, See a doctor (hidden when empty), patterns, retests, habits and questions with the disclaimer once per block, then the latest report card. |
| MEDI-160 | Landing for an international audience | No city in the hero band, the band has a gap above the ticker at 1280 and 390, trust and FAQ copy is international, "MediWise is not a medical device." is in the disclaimer. |
| MEDI-161 | International reports | US, UK, German and Australian fixtures read through upload, values show the printed unit with the canonical value when the units differ, HbA1c maps to one row. |
| MEDI-165 | Consent and age gate, security page | Sign-up has two unticked required consent boxes, upload is refused without health-data consent, the privacy policy carries a version, `/security` exists in both languages. |
| MEDI-169 | Centred tab bar with labels | The phone tab bar is centred with equal insets, each tab shows a one-line label that never truncates at 360 px, and the Ask launcher sits above the bar without covering a tab. |

Regression flows from before MEDI-96 that the card names (compare, export, share link and the doctor view, the Hindi switch, settings and account delete, the Google button) run in the same pass because MEDI-148, 151, 152, 156 and 169 restyled the screens they live on.

## 2. Result

The run covered 229 cases from the test plan (`.planning/e2e-verification/test-plan.md`, written by the pr-test-suite-writer agent). An independent grader, the phase-qa-runner agent in UI evidence audit mode, graded every case from the evidence on disk. The driver did not grade. The grader applied the override of this ticket: alignment, overflow, truncation, spacing, a centre that is off and a missing label are RED, not WARN. A probe with a violation that the case does not name is also RED.

| Grade | Cases |
|:-|:-|
| PASS | 136 |
| FAIL | 89 |
| BLOCKED | 3 |
| NOT DEPLOYED | 1 |

The 89 FAIL cases are of three types. Section 4 lists the product defects. Section 5 lists the evidence gaps and the probe-only failures: in those cases the behaviour held or was not observed, and a rerun with a better harness can turn them green.

A feature passes when none of its cases fails. A feature is fixed when this branch fixes every failing case of it. A feature fails in all other cases.

| Ticket | Cases pass / fail / blocked | Grade | What failed |
|:-|:-|:-|:-|
| MEDI-77 | 9 / 11 / 0 | fail | Ask double submit sends 4 questions (M77-R5). The rest are probe flashes and evidence gaps. |
| MEDI-97 | 6 / 1 / 0 | fail | Evidence gap only: no production font request capture (M97-G5). |
| MEDI-98 | 2 / 0 / 0 | pass | |
| MEDI-99 | 3 / 2 / 0 | fail | A report opened low on Home paints one frame at the old scroll offset (M99-R1). A pattern chip links to a fold that does not exist (M99-G3). |
| MEDI-100 | 2 / 0 / 0 | pass | Note: web and landing thresholds sit 13 to 15 points under the measured values. The rule says 10. |
| MEDI-148 | 7 / 10 / 2 | fail | Report header actions wrap to 3 ragged rows at 1280 (M148-G7). Pressed state moves under reduced motion (M148-G4). The rest are probe flashes and evidence gaps. |
| MEDI-149 | 7 / 5 / 0 | fail | Total tile clips at 320 (M149-G6). Blank page when the admin right goes away during a session (M149-R5). |
| MEDI-150 | 4 / 1 / 0 | fail | Evidence gap only: no probe on the theme switch (M150-G3). Contrast is 6:1 light and 9.27:1 dark. |
| MEDI-151 | 8 / 7 / 1 | fail | Panel title truncates the profile name at every width, down to "Ask abou..." at 320 (M151-G2, G3, R4, G12). The launcher covers page actions and footer links (M151-G10). |
| MEDI-152 | 4 / 5 / 0 | fail | Tab tap takes 504 ms at 4x CPU throttle (M152-G6). Last footer link of Trends not reachable above the bar (M152-G5). |
| MEDI-153 | 9 / 1 / 0 | fail | Settings About policy links are 17 px high (M153-G3). |
| MEDI-155 | 4 / 4 / 0 | fail | Attention row status bar does not match the row height at 390 (M155-G5). |
| MEDI-156 | 8 / 4 / 0 | fail | Report header overflows at 200 percent text (M156-G9). Risk chip flashes a group before it settles (M156-G6). |
| MEDI-157 | 4 / 6 / 0 | fail | Two filter combinations show neither rows nor the empty state at 390 (M157-G4). Trends overflows at 200 percent text (M157-G7). |
| MEDI-158 | 5 / 1 / 0 | fail | Evidence gap only: the See a doctor title was not read (M158-G3). |
| MEDI-159 | 5 / 10 / 0 | fail | Home load calls the model for the Year in review intro (M159-R1). Large empty gaps and a half-width block on Home (M159-G6). Home overflows at 200 percent text (M159-G8). No thousands separator in "1284 reports left" (M159-G9). "1 files" (M159-R5) is fixed on this branch. |
| MEDI-160 | 17 / 6 / 0 | fail | How it works phones are not aligned at 1280 (M160-G4). The sticky phone of the scroll story runs past the top and bottom of the screen at 1280 in Chromium and WebKit, local and production (M160-G10, G11, G13). |
| MEDI-161 | 10 / 5 / 0 | fail | US eGFR loses the printed range "> OR = 60" (M161-R4). Marker page breadcrumb truncates to "Hb..." at 390 (M161-G8). |
| MEDI-165 | 12 / 7 / 0 | fail | Sign-up double submit (M165-R6). No consent row until the upload page opens (M165-G1, G3). No gate after a 403 consent refusal (M165-R4). Consent label hit area 19 px (M165-G5). Production sign-up label is the older text (M165-G11, not deployed). |
| MEDI-169 | 9 / 2 / 0 | fail | Evidence gaps only: no probe on the tab route change (M169-G3) and the WebKit Hindi leg read English labels (M169-G7). Centring, labels and launcher clearance pass in Chromium and in WebKit. |

Totals for the DONE line: 2 features pass, 18 fail, 1 one-line fix on this branch (MEDI-159 finding F7). No feature is fully fixed by it, because MEDI-159 has other failing cases.

## 3. One-line fix on this branch

| Finding | Change | Test | Live check |
|:-|:-|:-|:-|
| F7: one file reads "1 files" and one marker reads "1 markers" (M159-R5) | `plural()` for `dashboard.recent.files` (English and Hindi) and `report.markerCount` (English) in `apps/web/src/config/messages` | `apps/web/src/config/messages/counts.test.ts` failed before the change and passes after it | `.planning/e2e-verification/qa/ui-case-M159-R5-after-fix.txt` reads "1 file"; `ui-case-M159-R5-reportlist-after-fix.txt` reads "1 marker" |

Commit: `fix(web): singular form for one file and one marker (MEDI-171)`.

## 4. RED findings: product defects

Each finding gives the page, the viewport, the measured numbers, the screenshot and the reproduction. Screenshots are under `.planning/e2e-verification/qa/` (local evidence, not committed). Ticket filing is for the orchestrator.

### 4.1 High

1. **Sign-up double submit (MEDI-165).** Page `/signup`, 1280 and 390. A double click on Create account plus Enter twice sends 4 sign-up requests. Supabase answers 500 to 3 of them. At 1280 the form then shows "We could not complete this. Try again." although the account exists, and no session starts. Screenshot `.planning/e2e-verification/qa/M165-R6-double-D.png`. Reproduce: fill a new email and password, tick both boxes, double click Create account, press Enter twice. Cause: the submit guard reads the render-time pending state, so submits inside one frame all pass (`credentials-form.tsx`).
2. **Ask double submit (MEDI-77).** Page `/ask` and the widget, 1280 and 390. A double click on Send plus Enter twice sends 4 questions on the page and 2 in the widget. Each one counts against the quota and can call the model. Screenshot `.planning/e2e-verification/qa/M77-R5-page-D.png`. Reproduce: type "How many mg?", double click Send, press Enter twice. Cause: the same render-time guard in `ask-input.tsx`.
3. **Home load calls the model (MEDI-159).** Page `/`. The Year in review card calls `GET /profiles/:id/year-review`, which writes the intro with the model on a Home load. The card text of MEDI-159 says "a Claude call on Home load" must not happen. Evidence `.planning/e2e-verification/qa/be-M159-R1-home-ui.txt`. Reproduce: load `/` and search the API log for "Year review intro". The dashboard endpoint itself makes no call (M159-R1 API half passes).
4. **No consent row after sign-up (MEDI-165).** API `/me/consents` and `/me/export`. A user who ticks both boxes at sign-up has no consent row and an empty export list until the upload page opens. The acceptance time then records the upload page visit, not the sign-up. Evidence `.planning/e2e-verification/qa/be-M165-G1.txt`, `be-M165-G3.txt`. Reproduce: sign up, do not open `/reports/upload`, call `GET /me/consents`. Upload stays refused without health data consent, so no report is read without consent.
5. **Scroll story phone runs off the screen (MEDI-160).** Landing `/`, 1280x800, Chromium and WebKit, local and production. At step 1 the sticky phone spans 291 to 902 px (Chromium) and 291 to 933 px (WebKit) on an 800 px viewport. At step 4 its top is at -85 and -117. Screenshots `.planning/e2e-verification/qa/LAND-story-chromium-1280-step1.png`, `LAND-story-webkit-1280-step4.png`, `prod-story/LAND-story-chromium-1280-step4.png`. Reproduce: at 1280 scroll each `.story-step` to the viewport centre and read the phone rect.

### 4.2 Medium

6. **Ask panel title truncates the name (MEDI-151).** Widget, 1280, 390, 360 and 320. "Ask about Dense His..." at 1280, "Ask about Den..." at 360, "Ask abou..." at 320 (clientWidth 84 of 742). Screenshots `.planning/e2e-verification/qa/M151-G2-D.png`, `M151-G3-S.png`, `M151-G12-panel-320.png`.
7. **The Ask launcher covers page actions (MEDI-151).** Report page and footers, 1280 and 390. 10 links and summaries are under the launcher at 1280; at 390, 9 are under the launcher and 5 under the tab bar at the bottom scroll position. Footer link clearance is 4 px (the plan asks for 8). Screenshots `.planning/e2e-verification/qa/M151-G10-D.png`, `M151-G10-M.png`.
8. **Report header actions wrap to three ragged rows (MEDI-148).** Report page, 1280. Left edges 844, 832, 1073; Delete report alone on the third row. Screenshot `.planning/e2e-verification/qa/M156-G1-D.png`. MEDI-170 (in progress) replaces this row with icon buttons.
9. **Home spacing (MEDI-159).** Home, 1280 and 390. The gap before Year in review is 346 px (1280) and 460 px (390) against a median of 40. At 1280 the Habits block is half width with an empty right column 2120 px tall. Screenshots `.planning/e2e-verification/qa/M159-G1-D.png`, `M159-G1-M.png`.
10. **How it works phones are not aligned (MEDI-160).** Landing, 1280. Phone tops 1743, 1815 and 1767 (spread 72 px, tolerance 2). Screenshot `.planning/e2e-verification/qa/M160-G4-D.png`.
11. **No gate after a 403 consent refusal (MEDI-165).** Upload page, 1280. When the server refuses an upload for a missing health data consent, the page shows only an inline error and no consent gate. Screenshot `.planning/e2e-verification/qa/M165-R4-gate-D.png`. Reproduce: choose a file, change the stored health data policy version, click Read my report. In this run the app re-stored the consent from the sign-up metadata, so a real policy change was not reproduced end to end.
12. **US eGFR range lost (MEDI-161).** API and marker page. The US fixture prints "> OR = 60"; the stored lab range is null and the page says "The report shows no lab range." Screenshot `.planning/e2e-verification/qa/M161-marker-US-egfr-M.png`. Related: the AU report stores two HbA1c rows (one in %, one in mmol/mol); the page shows one (`be-M161-db.txt`).
13. **Text at 200 percent overflows the page (MEDI-156, 157, 159, 165).** Report header (scrollWidth 1567 on 1280, actions off screen), Trends (1427), Home (480 on 390), user menu and Settings (542 on 390). Screenshots `.planning/e2e-verification/qa/M156-G9-D-200pct.png`, `M157-G7-en-M-200pct.png`, `M159-G8-long-M-200pct.png`, `M165-R7-menu-M-200pct.png`.
14. **Tab tap is slow under throttle (MEDI-152).** Trends, 390, 4x CPU throttle. Longest event 504 ms, longest task 413 ms (budget 250 and 300). Screenshot `.planning/e2e-verification/qa/M152-G6-M.png`.
15. **Blank operator page after the admin right goes away (MEDI-149).** `/admin`, 1280. The refetch answers 404 and the page goes blank with no error text and no retry. Screenshot `.planning/e2e-verification/qa/M149-R5-after-D.png`.
16. **Trends filter state at 390 (MEDI-157).** `?direction=improving&status=risk` and `&status=watch` show no rows and no empty state at 390, while 1280 shows 4 and 1 rows. Screenshot `.planning/e2e-verification/qa/M157-G4-M.png`.

### 4.3 Low

17. **Hit areas under 24 px.** Sign-up Terms label 19 px (`M165-G5-M.png`), Settings About policy links 17 px (`M153-G3-M.png`).
18. **Number formatting.** "1284 reports left" without a separator (`M159-G9-credits-320.png`, F9). Operator total "1,23,640" clips at 320 (`M149-G6-320.png`).
19. **Truncation on the marker page breadcrumb** at 390: "Hb..." (`M161-marker-UK-hba1c-M.png`).
20. **Attention row status bar** is 36 px against a 64 to 88 px text block at 390 (`M155-G2-M.png`).
21. **First frame at the old scroll offset** when a report opens from low on Home, 390 (`M99-R1-M.png`).
22. **Pattern chip links to a missing fold** (`#pattern-b12_deficiency` on a report with no patterns fold, `M99-G3-D.png`).
23. **Pressed button moves under reduced motion** (`M148-G4-D.png`).
24. **Emoji-first profile name** shows a box glyph in the switcher avatar (`M159-G8-emoji-M.png`).
25. **Trends last footer link** is not reachable above the tab bar at 390 (`M152-G5-M.png`).
26. **Rule gap in the Ask dose filter.** "How many mg?" passes the rule-based gate (`assistant.gate.ts`) and reaches the model. The model prompt and the validator still forbid dosing, so this is a pre-filter gap, not an unsafe answer.
27. **Emergency copy names India-only numbers** (112, Tele-MANAS 14416) while the landing now targets an international audience.

### 4.4 Card and code disagreements (recorded, not graded as defects)

F1 Codegenix in code versus CodeGenics on the card. F2 no postal address or GSTIN on the policy pages. F3 no company line in the app and auth footers. F4 the landing FAQ names Mumbai. F5 the English 404 uses `lang="en"`, not `en-IN`. F6 the security page language switch links to the other home page. F8 the upload gate asks for terms, while `POST /reports` checks only health data. F11 catalog habit lines name local foods (maida, ghee) and cite ICMR-NIN.

## 5. Evidence gaps and probe-only failures

These cases failed because the evidence could not confirm the assertion. They are not product defects. The next run must close them.

- **Selector misses:** trend suggestion text read empty (M157-G3, M157-R1, M157-G6); the See a doctor title (M158-G3); the "Markers behind this suggestion" label (M159-G5); press scale read as transform (M152-G2).
- **Missing legs:** M155-R2 UI half, M155-G5 at 320 and 200 percent, M159-R3 Hindi, M77-G3 at 390, M148-G9 at 390 (the export tab opened at 1200 px), M148-G10 expired link and SQL, M148-G12 row counts, M148-R3 failed-report step, M149-G3 date bounds, M155-G6 chips, M165-G6 at 1280, M156-G2 and M156-R1 on a report with findings and patterns, M161-G6 and M161-G7 at 1280, M169-G7 Hindi in WebKit, M97-G5 production fonts, M160-R9 sitemap alternates, M148-G5 and M148-R4 (no evidence).
- **No data:** DENSE has no retest row, so M159-G4, M159-G10 and M157-R3 were not exercised.
- **Probe flashes not named as transients:** loading placeholders, chart measurement spans, the empty fact card, typed drafts and icon swaps (M77-G1, G2, G6, G9, G11, M151-G2, G6, G8, M155-G2, M159-G3, M148-G8, G11, M152-G3, G4, M160-R6). M149-R3 and M149-R4 fail only on the 404 that the case itself requires. M77-G8 and M77-R4 armed the probe too early.
- **M77-G10:** the review CLI sampled 0 items for the day, so the printout was not observed.
- **M161-G1:** `pnpm eval:mapping` maps 305 of 323 names; no baseline from before MEDI-161 was run, so "no lost mapping" is not proven.
- **M171-R1:** 44 of 156 probe files have violations; section 4 and this section classify them.

## 6. WebKit results for the landing scroll story

| Run | Engine | 390 | 1280 | Down and up scan at 1280 |
|:-|:-|:-|:-|:-|
| Local static export | Chromium 153 | 4 of 4 steps show their own screen (opacity 1, others 0), inline phones 237 px wide and inside the viewport, no page error | 4 of 4 steps show their own screen; sticky phone off screen at steps 1 and 4 (finding 5) | 44 samples, never blank, index monotonic, no overlap with the Bento |
| Local static export | WebKit 26.6 | same as Chromium; 11 of 11 images load | same as Chromium; off screen at steps 1 and 4 | 45 samples, never blank, monotonic, no overlap |
| Production | Chromium 153 | same as local | same as local | 44 samples, never blank, monotonic |
| Production | WebKit 26.6 | same as local | same as local | 45 samples, never blank, monotonic |

Both engines support `animation-timeline: view()` and run the timeline path. Evidence: `.planning/e2e-verification/qa/LAND-story-chromium.json`, `LAND-story-webkit.json`, `prod-story/`. WebKit also passed the app tab bar centring and labels in English (M169-G7) and the glass blur with hide and show on scroll (M152-G7).

## 7. Safety of the run

- Production: read only. The production batch recorded 0 write requests (`prod-write-requests.json`). The Google check stopped at the accounts.google.com sign-in page.
- Dev (mediwise-dev): read only, demo account `arjun.demo@example.com` through an admin magic link (no email sent). A request guard blocked every non-GET call to the API; it blocked 0 requests (`dev-blocked-writes.json`). The API ran with the worker off.
- No real report was uploaded. Uploads used the made-up fixtures in `apps/api/fixtures`. The four international fixtures used the live model once on the local stack, with a 300 cent cap; the spend was 1.69 cents.
- The copied env files and the session file were deleted. No secret is in the logs or the evidence (`be-M171-R1.txt`).
- The local test data changes (aged dates, long names, the 123,456 ledger rows) were reverted after their cases.

## 8. Commands for the next run

Ports: the local stack uses 3101 (API), 5273 (web) and 3100 (landing) so that another session can keep 3001, 5173 and 3000. Supabase is the shared e2e project in `apps/e2e/supabase` (never stop it).

```bash
# 1. Feature list
git log --merges --first-parent --oneline <MEDI-96 merge>..HEAD
curl -s "http://localhost:4710/api/cards?board=MEDI"

# 2. Local stack (values from `supabase status --workdir apps/e2e --output json`)
cd apps/api && PORT=3101 CORS_ORIGINS=http://localhost:5273 WEB_ORIGIN=http://localhost:5273 \
  DATABASE_URL=$DB_URL SUPABASE_URL=$SB_URL SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY SUPABASE_JWT_SECRET=$JWT_SECRET \
  NODE_ENV=development RUN_WORKER=true CLAUDE_STUB=true ANTHROPIC_API_KEY= ADMIN_USER_ID=00000000-0000-4000-8000-00000000ad01 \
  PAYMENTS_ENABLED=true CASHFREE_STUB=true CASHFREE_APP_ID=e2e-app-id CASHFREE_SECRET_KEY=e2e-secret-key CASHFREE_ENV=sandbox \
  ASSISTANT_ENABLED=true pnpm exec tsx --conditions=development src/index.ts
cd apps/web && VITE_API_URL=http://localhost:3101 VITE_SUPABASE_URL=$SB_URL VITE_SUPABASE_ANON_KEY=$ANON_KEY \
  VITE_PAYMENTS_ENABLED=true VITE_CASHFREE_MODE=sandbox VITE_APP_ORIGIN=http://localhost:5273 VITE_LANDING_URL=http://localhost:3100 \
  pnpm exec vite --port 5273 --strictPort

# 3. Seeds
pnpm -F @mediwise/api credits:grant <email> <n> qa
pnpm -F @mediwise/api db:seed-history <email>

# 4. API variants: restart the API with one value changed
#    ASSISTANT_ENABLED=false | ADMIN_USER_ID= | ASSISTANT_REVIEW=true | CLAUDE_MONTHLY_CAP_CENTS=0
#    live model for the international fixtures: CLAUDE_STUB=false CLAUDE_MONTHLY_CAP_CENTS=300

# 5. Landing as shipped (static export with the nearest 404.html)
NEXT_PUBLIC_SITE_URL=http://localhost:3100 NEXT_PUBLIC_APP_URL=http://localhost:5273 pnpm turbo run build -F @mediwise/landing
node apps/e2e/perf/serve.ts 3102 3100

# 6. WebKit
cd apps/e2e && pnpm exec playwright install webkit

# 7. Static checks (never together with the dev servers on an 8 GB machine)
pnpm check
pnpm coverage
pnpm -F @mediwise/engine test
pnpm -F @mediwise/api test:db -t "<test name>"
pnpm eval:mapping
```

Browser notes for the next run:

- Stub `window.print` with a context init script. The export page calls it once its pages are cut, and the native print dialog freezes an automated browser.
- Set the theme with `html[data-theme=dark]`. The app does not use a `dark` class.
- Name loading placeholders, chart measurement spans and typed-draft clears as expected transients in the probe, or the probes fail on them.
- Arm the probe after a reload, not before it.
- Chrome DevTools MCP was not available in this session. Playwright MCP drove Chromium from the main thread, and a Playwright script drove WebKit.

Evidence index: plan `.planning/e2e-verification/test-plan.md`, grades `.planning/e2e-verification/qa/AUDIT.md`, grader brief `.planning/e2e-verification/auditor-brief.md`, case files `.planning/e2e-verification/qa/ui-case-*.txt` and `be-*.txt`, probes `*.probe.json`, logs `.planning/e2e-verification/logs/`.

## 9. Case grades (from the grader, unedited)

Paths in this table are relative to `.planning/e2e-verification/qa/` unless they start with `logs/`. A short form such as `-M.png` or `-D/M.txt` after a full name means the same case file for the other viewport. `ui-case-M77-R5-D.txt` holds both viewports of M77-R5.

| Case | Grade | Reason |
|:-|:-|:-|
| M98-G1 | PASS | be-M98-G1.txt: pnpm check exit=0, 22 of 22 tasks successful, wall time 154.7 s. |
| M98-R1 | PASS | be-M98-R1.txt: 0 timeout lines in pnpm-check.log, docs/testing.md line 17 present, no testTimeout in any Vitest config. |
| M99-G1 | PASS | be-M99-G1.txt: one hit for each of the three test names, check exit 0 (be-M98-G1.txt). |
| M99-R2 | PASS | be-M99-R2.txt: 3 of 3 test:db runs passed (1, 1 and 4 tests); skipped counts are the tests the -t filter excludes. |
| M100-G1 | PASS | be-M100.txt, logs/coverage.log: pnpm coverage exit=0. Plan error: the design-tokens, engine and shared threshold sets in the plan are rotated (actual 97/93/100/98, 93/88/97/94, 100x4). |
| M100-R1 | PASS | be-M100.txt: every threshold at or below its measured value, docs/testing.md line 51 rule exists. Finding (plan says finding, not FAIL): gap above 12 on web (13.96 to 14.75) and landing (13.08 to 14.25). |
| M148-R1 | PASS | be-M148-R1.txt: only the ask-suggestions.ts:5 comment; the upstream label is present. |
| M148-R2 | PASS | be-M148-R2.txt: removed ids are only admin-* ids; all 6 button variants present. |
| M150-R2 | PASS | be-M150-R2.txt: mascot.tsx 2604 bytes, no raster, no new dependency, no medical symbol. |
| M153-G4 | PASS | be-M153-G4.txt: 5 templates with 1 company line each, no placeholder. |
| M153-R2 | PASS | be-M153-R2.txt: one spelling, "Codegenix" (15 hits); finding F1 (card spells CodeGenics) stays open. |
| M97-G4 | PASS | be-M97-G4.txt: docs/i18n.md "404 page" section records the choice; both 404/page.tsx files exist. |
| M158-G1 | PASS | be-M158-G1.txt: 22 of 22 files and 739 tests pass; forbidden-words, suggestions and suggestion tests passed (logs/coverage.log). |
| M158-R1 | PASS | be-M158-R1.txt: source tests at lines 22 and 52, forbidden-word tests present; medicine words only in other.ts, vitamins.ts and hi/vitamins.ts, as the plan predicts. |
| M160-R1 | PASS | be-M160-R1.txt: only pricing.ts and faq.ts:37 (Mumbai, finding F4); the security.test.tsx hit asserts absence. |
| M160-R2 | PASS | be-M160-R2.txt: only the landing.tsx:37 comment, no em dash. |
| M161-G1 | FAIL | be-M161-G1.txt, logs/eval-mapping.log: not confirmable. Engine suite 739/739, but eval:mapping ends "total: 305/323 mapped" (18 unmapped) and no baseline was run to show no lost mapping. |
| M161-R6 | PASS | be-M161-R6.txt, M161-R6-uk-page1-1.png: made-up lab names only, no NHS name or logo. |
| M165-R3 | PASS | be-M165-R3.txt: SOC 2 and HIPAA hits are negative test assertions; policyVersion 2026-10-15; migrations 0028 and 0029 present. |
| M161-R3 | PASS | be-M161-R3.txt: 2 of 2 targeted tests passed. |
| M165-G1 | FAIL | be-M165-G1.txt: GET /me/consents as DENSE answers "consents":[],"missing":["terms","health_data"] and SQL returns []; sign-up stores no consent row, rows are written only on the first upload page visit (use-auth.ts line 25). |
| M165-G2 | PASS | be-M165-G2.txt: 403 with missingConsent "health_data", reports count 0 (the copy is in title, the plan names detail). |
| M165-R1 | PASS | be-M165-R1.txt: 201 twice, 2 rows with version 2026-10-15 and 64 character hashes, empty version refused by consent_records_policy_version, no token 401, retry 201. |
| M165-R2 | PASS | be-M165-R2.txt: missing ["health_data"], then 403, then 201, 3 history rows. |
| M165-G3 | FAIL | be-M165-G3.txt: export 200 with the right Content-Disposition, but .consents is [] where ["health_data","terms"] is expected (same root cause as M165-G1). |
| M158-G2 | PASS | be-M158-G2.txt: 200, private no-cache, 11 items by rank, exact disclaimers, every item has next, If-None-Match 304, Hindi disclaimer correct. |
| M158-R2 | PASS | be-M158-R2.txt: forbidden matches [], questions 630 before and after, 0 Claude lines, ASKQ 404, anonymous 401, unknown profile 404. |
| M155-G1 | PASS | be-M155-G1.txt: 20 unique marker rows, b12 once, all from older reports, risk then watch. |
| M159-R1 | FAIL | be-M159-R1.txt: /dashboard half clean (0 Claude lines), but be-M159-R1-home-ui.txt and logs/api.log show Home load calls GET /year-review, which logs "Year review intro cost ... model: 'claude-haiku-5-5'" 5 times, each "rejected twice", so the model call repeats on each Home load. |
| M149-G1 | PASS | be-M149-G1.txt: 200 with reportCredits, questionPacks, eventLimit, totals in amountPaise, no usd, dollar, cost, cents or $; failed-reports 200. |
| M149-R1 | PASS | be-M149-R1.txt: four 404 "Not Found" as DENSE, four 401 anonymous. |
| M77-R2 | PASS | be-M77-R2.txt: six 201, then 429 "You can ask 6 questions in one minute. Try again later.", rows 6 before and after. |
| M77-R3 | PASS | be-M77-R3.txt: 429 "You can ask 30 questions in one day. Try again tomorrow.", chest pain gives the 201 emergency copy, cleanup done. |
| M165-G4 | PASS | ui-case-M165-G4-D.txt, ui-case-M165-G4-M.txt: both boxes start unchecked with the exact labels; errors 2 then 1 with 0 sign-up requests; step 4 makes 1 request and user-menu shows; Terms and Privacy policy links open in a new tab; all 4 probes 0. |
| M165-G5 | FAIL | ui-case-M165-G5-D.txt, ui-case-M165-G5-M.txt: the Terms label (hit area) is 19 px high at D and M, the case asks for at least 24 px. Centre diff 0.5, gap 12, wrap and noOverflow hold. |
| M165-G6 | FAIL | ui-case-M165-G6-M.txt: not confirmable. The M leg passes every step (gate text, disabled then enabled, report-done, probes 0), but there is no D evidence file and no DB read of the consent_records rows. |
| M148-G6 | FAIL | ui-case-M148-G6-redirect-D.txt, ui-case-M148-G6-redirect-M.txt: one authorize request with provider=google and the right redirect_to, probes 0, but sawOpening is false on 4 of 4 runs; M148-G6-login-redirect-M.png shows "Continue with Google", not "Opening Google". |
| M165-R6 | FAIL | ui-case-M165-R6-D.txt, ui-case-M165-R6-M.txt: step 6 (double click plus Enter twice) sends 4 sign-up requests, not 1; M165-R6-*-step6-double.probe.json violations 3, badRequests 3 x /auth/v1/signup status 500; at D the form shows "We could not complete this. Try again." and no session starts. |
| M165-R8 | PASS | be-M165-R8-api.txt (missing ['terms'], POST /reports HTTP 201), ui-case-M165-R8-D.txt (gate shows only the Terms box, probes 0), M165-R8-step7-retry.json (report-done after a credit grant). Finding F8 recorded. |
| M165-R9 | PASS | ui-case-M165-R9-app-M.txt (hosts only localhost:5273, 127.0.0.1:54321, localhost:3101; local font preload; no cookie) and ui-case-M165-R9-landing-D.txt (/, /hi, /security call only localhost:3100). |
| M159-G2 | PASS | ui-case-M159-G2-D.txt, ui-case-M159-G2-M.txt: one See a doctor region, Today badge, exactly one disclaimer, exact source line, the link opens #studies, probes 0. |
| M159-R2 | PASS | be-M159-R2.txt (doctor items []) and ui-case-M159-R2-D.txt, ui-case-M159-R2-M.txt: region 0, heading 0. |
| M156-G1 | PASS | ui-case-M156-G1-D.txt, ui-case-M156-G1-M.txt: score 86, 3 rows plus "2 more" (API 5), band before nav before folds, noOverflow true. The plan selector h2#verdict measures the heading only; the verdict block is centred on the ring in M156-G1-D.png. |
| M156-G2 | FAIL | ui-case-M156-G2-D.txt, ui-case-M156-G2-M.txt: not confirmable. The DENSE report has no Findings fold and Follow-ups, Questions and Unmeasured are 0, so the ellipsis preview was never observed; Linked reports and Notes h2 carry no count. |
| M156-G3 | PASS | ui-case-M156-G3-D.txt (sticky nav top 48, summary 113 below nav 97) and ui-case-M156-G3-M.txt (Go to button 358 wide equals the fold column, 6 menu items match 6 folds); probes 0. |
| M156-G4 | PASS | ui-case-M156-G4-D.txt, ui-case-M156-G4-M.txt: key holds {"markers":true}, state kept after reload and shared across reports, deep link lands below the nav, probes 0. |
| M156-G5 | PASS | ui-case-M156-G5-pass1-D/M.txt and pass2-D/M.txt: "Studies 1" with Risk 1, badge gone and line under Settled after scan 2, impression 17px/600, lab and date present, card 356 inside a 358 fold, probes 0. No Measurements list because the fixture has none. |
| M156-G6 | FAIL | M156-G6-D-risk.probe.json and M156-G6-M-risk.probe.json: violations 1, flashes ["DETAILS Heart1Lab: Moon Labs1RiskHomocysteine..."], not named as a transient; the "<n> markers shown" count after Risk is not recorded. |
| M156-G7 | PASS | ui-case-M156-G7-D.txt, ui-case-M156-G7-M.txt: chevronGap 0, h2Indent 0, baseline 2, height 60 to 84, noOverflow true. openChevronTransform "none" because Tailwind v4 rotate-180 sets the rotate property (plan selector wrong for the code); M156-G7-M.png shows the open chevron up. |
| M156-R1 | FAIL | ui-case-M156-R1-D.txt, ui-case-M156-R1-M.txt: not confirmable. The DENSE half passes (93 rows equal API 93, all hit-testable), but the plan's UPLOAD REPORT_LAB leg (Patterns, Follow-ups filled) has no evidence. |
| M156-R2 | PASS | ui-case-M156-R2-D.txt: details 0, 114 tr[data-atom] rows, download visible, lab on 5 pages, printCalls 1 (stub). |
| M156-R3 | PASS | ui-case-M156-R3-M.txt: longest event 112 ms (budget 250), longest long task 128 ms (limit 300). |
| M148-G1 | PASS | ui-case-M148-G1-D.txt (button bottom 524 equals Report and Kind bottoms, button left 760 after Kind right 748) and ui-case-M148-G1-M.txt (stacked, left 16, noOverflow true); M148-G1-D.png agrees. |
| M148-G2 | PASS | ui-case-M148-G2-D.txt: linking state seen, API lists 1 confirmed repeat link, Remove link restores the form; link and unlink probes 0. |
| M165-R4 | FAIL | ui-case-M165-R4-D.txt, be-M165-R4.txt: the 403 missingConsent health_data is correct and no report is created (3 before, 3 after), but no consent gate shows, only an inline error (M165-R4-gate-D.png); M165-R4-D-submit.probe.json violations 5 (flashes include the error UL and "DIV Loading", badRequests /reports 403); after reload the gate is still 0 (M165-R4-after-reload.json). |
| M155-G2 | FAIL | ui-case-M155-G2-D.txt, ui-case-M155-G2-M.txt: list checks pass (20 rows equal 20 API rows, 20 unique, rank order, B12 once on its report, click URL right), but M155-G2-D-b12click.probe.json violations 18 and M155-G2-M-b12click.probe.json violations 20, flashes ["1","0","317","269",...] from SPAN#recharts_measurement_span, not named as a transient. |
| M155-G3 | PASS | ui-case-M155-G3-D.txt, ui-case-M155-G3-M.txt: All pressed first, Risk 10 of 10, Watch 10 of 10, Worsening 0 rows plus the empty state, union equals All, group label "Filter the list", 8 probes 0. No worsening marker on DENSE, so the positive Worsening path is not exercised. |
| M155-G4 | PASS | ui-case-M155-G4-D.txt, ui-case-M155-G4-M.txt: 5 of 5 rows have the date of the last trend point and delta equal to last minus previous; equal values read "No change". |
| M155-G5 | FAIL | ui-case-M155-G5-M.txt: at 390 the status bar is 36 px high against a text block of about 64 px (88 px rows) and 88 px (112 px row with a 2-line name), off by 28 to 52 px, tolerance 8; badge and value read null (selector miss); the 320 px and 200 percent text step has no file (M155-G5-extra missing). |
| M155-R1 | PASS | M155-R1-s1.json (studyRows 1 after S1), M155-R1-s2.json (studyRows 0 after S2), M155-R1-D-after-S2.probe.json violations 0 with "Study report" armed; DENSE names unique. |
| M155-R2 | FAIL | be-M155-R2.txt: API half passes (slowest of 5 calls 0.104 s); the UI chip click half (longest event at most 250 ms) has no evidence, not confirmable. |
| M159-G1 | PASS | ui-case-M159-G1-D.txt, ui-case-M159-G1-M.txt: h2 order, 5 source lines and 5 "Open trends" links match; greeting and New since strip first; Due for retest absent for DENSE, which the plan allows. |
| M159-G3 | FAIL | ui-case-M159-G3-D.txt, ui-case-M159-G3-M.txt: content passes (B12 deficiency once, Prediabetes Cleared, 1 disclaimer, chip opens the marker page), but M159-G3-D.probe.json violations 17 (recharts flashes) and M159-G3-M.probe.json violations 20 with settled:false. |
| M159-G4 | FAIL | ui-case-M159-G4-D.txt, ui-case-M159-G4-M.txt: not confirmable, {"exists":0}; DENSE has no Due for retest block (logs/dashboard-dense.json retests []), so rows, aria-label, icon button and .ics were never exercised. |
| M159-G5 | FAIL | ui-case-M159-G5-D.txt, ui-case-M159-G5-M.txt: not confirmable. Groups, 8 + 2 rows and 1 disclaimer pass; all 7 regex hits are lab values (0 real dose words); but markersBehind is 0, the "Markers behind this suggestion" label was not found (probably a selector miss, the code sets it as aria-label in marker-chip-list.tsx line 16). foodWords maida, ghee (F11). |
| M159-R3 | FAIL | ui-case-M159-R3-en-D.txt, ui-case-M159-R3-en-M.txt: English passes (3 blocks, exactly 1 disclaimer each); the Hindi half has no evidence (the M159-R3-hi file the case names does not exist), not confirmable. |
| M159-R4 | PASS | ui-case-M159-R4-D.txt, ui-case-M159-R4-M.txt: both headings exist, /year-review opens, back returns to /, stale 0, back probes 0. addLink 0 is right for the code: family-list.tsx line 70 shows "Add a family member" only below 2 members and DENSE has 2. |
| M159-G6 | FAIL | ui-case-M159-G6-D.txt, ui-case-M159-G6-M.txt: spacing fails. Gap from Ask about your reports to Year in review is 346 px at D (5570 to 5916) and 460 px at M (7794 to 8254) against a median of 40; at D Habits is half width (l 272, r 740) with an empty right column 2120 px tall. |
| M159-G10 | FAIL | ui-case-M159-G10-D.txt, ui-case-M159-G10-M.txt: stale line, no NaN, no console error and the revert pass (logs/aged-restored.json equals aged-originals.json), but after the 120 day shift retest is [] (no "Due since" row, no .ics DTSTART) and trendSugg ["",""], doctor-line ending not confirmed. |
| M158-G3 | FAIL | ui-case-M158-G3-D.txt: not confirmable. Habit and supplement_ask titles match the API in rank order, but the See a doctor title reads [""] against the API "Show 10 results to your doctor" (selector read the aria-hidden status span). |
| M157-G1 | PASS | ui-case-M157-G1-D.txt, ui-case-M157-G1-M.txt: both chips pressed and in the URL, 93 to 0 rows, kept after reload, back restores, second tab same state, 4 probes 0. |
| M157-G2 | PASS | ui-case-M157-G2-D.txt, ui-case-M157-G2-M.txt: set equal to Home, B12 once, "Show 15 more" for 20 rows, every row has its fields. No worsening row on DENSE, so the Worsening tag is untested. |
| M157-G3 | FAIL | ui-case-M157-G3-D.txt, ui-case-M157-G3-M.txt: all 93 trend-suggestion texts read "" (notEnding 93) and hiSample ""; only the detail text ends with the doctor line; M157-G3-en-D.png shows the Settings page, not Trends. |
| M157-G4 | FAIL | ui-case-M157-G4-M.txt: at 390 ?direction=improving&status=risk and ?direction=improving&status=watch show rows 0 and empty 0 (neither rows nor the empty state), while D shows 4 and 1 rows (ui-case-M157-G4-D.txt). |
| M157-G5 | PASS | ui-case-M157-G5-D.txt, ui-case-M157-G5-M.txt: sort right 1248 equals content right, category and sort share top 695, group labels left of their chips, every group inside 374 at M, noOverflow at both widths. Chips 32 px at 390 are a recorded plan finding. |
| M157-R1 | FAIL | ui-case-M157-R1-D.txt: not confirmable; the suggestion texts read empty in every state (notEnding equals n: 93, 9, 84, 10, 10, 73), so regexHits [] proves nothing. |
| M157-R2 | PASS | ui-case-M157-R2-D.txt, ui-case-M157-R2-M.txt: maxEvent 144 ms (D) and 112 ms (M), long task 60 ms and 0, 6 probes 0. |
| M157-R3 | FAIL | ui-case-M157-R3-D.txt: not confirmable, OBSERVED []; DENSE has no Home retest row to compare. |
| M99-G2 | PASS | ui-case-M99-G2-M.txt: offset 8603.5, all 10 samples after back 8603.5, URL /, M99-G2-M-back.probe.json violations 0. |
| M99-R1 | FAIL | ui-case-M99-R1-M.txt: first sample on /reports/5845336f... is scrollY 8603.5 with h1 at -8531; the Probe line forbids any scrollY above 0 on the report route with no transient. |
| M150-G1 | PASS | ui-case-M150-G1-D.txt, ui-case-M150-G1-M.txt: 8 svgs per column (idle, listening, thinking, talking) at 96 and 48, rect equals the attribute, captions match, noOverflow at 1280 and 390; M150-G1-D.png and -M.png show the droplet, no cross. |
| M150-G2 | PASS | ui-case-M150-G2-D.txt: every animation name as stated. Listening reads transform "none" because the code uses -rotate-8 (CSS rotate, mascot.tsx line 16); plan reads the wrong property; the lean is visible in M150-G1-D.png. |
| M150-R1 | PASS | ui-case-M150-R1-D.txt, ui-case-M150-R1-M.txt: animation names ["none"], running 0 at both viewports. |
| M150-G3 | FAIL | ui-case-M150-G3-launcher-D.txt: not confirmable. Contrast holds (6:1 light, 9.27:1 dark), but the theme was set by attribute, not the user-menu switch, and there is no probe, so the forbidden unreadable outline mid-switch was never observed. |
| M151-G1 | PASS | ui-case-M151-G1-D.txt, ui-case-M151-G1-M.txt: launcher on 12 routes, absent on 4, label "Open the chat", 56x56, insets 16, bottom 752 above tab bar top 762 at M. |
| M151-G2 | FAIL | M151-G2-D.png: panel title cut to "Ask about Dense His..." (truncation); M151-G2-D-open.probe.json violations 4, flashes ["SPAN ","SPAN ","DIV Loading","DIV Loading"] and the title changes from "Ask about your reports" at 432 ms, not the named zoom and fade transient. Size, insets, radius 24, blur and focus pass. |
| M151-G3 | FAIL | ui-case-M151-G3-M.txt, ui-case-M151-G3-S.txt: sheet geometry passes (left 0, right vw, bottom vh, radius 24, noOverflow), but the title is truncated: "Ask about Dense Hi..." in M151-G3-M.png and "Ask about Den..." in M151-G3-S.png. |
| M151-G4 | PASS | ui-case-M151-G4-D.txt: focus stays inside 30/30, Escape closes, focus back on ask-launcher, log labelled "Questions and answers", probe 0. |
| M151-G5 | PASS | ui-case-M151-G5-D.txt, ui-case-M151-G5-M.txt: X, backdrop and Escape each close by 300 ms, no scroll lock left, scrollDelta 0, draft gone, 6 probes 0. |
| M151-G6 | FAIL | ui-case-M151-G6-D.txt: states run idle, listening, thinking, talking, idle, but M151-G6-D.probe.json violations 1 with settled:false (talking to idle at 4172 ms); the Probe line names only assistant-pending. |
| M151-G7 | PASS | ui-case-M151-G7-D.txt, ui-case-M151-G7-M.txt: user bubble right, answer left at 92 percent, chips below, form gap 13 and 12, one primary ("Send"). |
| M151-G8 | FAIL | ui-case-M151-G8-D.txt, ui-case-M151-G8-M.txt: prefill works with 0 posts before Send, but M151-G8-D and -M probes violations 4 each: flashes "DIV Loading", empty SPAN and the title change to "Ask about Dense History's reports"; only the open animation is named. |
| M151-G9 | PASS | ui-case-M151-G9-D.txt, ui-case-M151-G9-M.txt: /ask?q=partial, input "partial", heading "Ask about Ask Member's reports", launcher 0, 18 items, aside at D, probes 0. |
| M151-G10 | FAIL | ui-case-M151-G10-D.txt, ui-case-M151-G10-M.txt: on the report page 10 interactive elements (A, SUMMARY) intersect the launcher at 1280; at 390 9 elements under the launcher and 5 under the tab bar; footer clearance 4 px on 4 pages (needs 8). The launcher also covers Home attention rows (M169-G4-1280.png, M169-G1-600.png) and row units at 390 (M157-G5-M.png, M159-G2-M.png). |
| M151-R2 | PASS | ui-case-M151-R2-M.txt: page locked, y 600 before and after overlay wheel, thread wheel and close, probe 0; the thread scroller has overscroll-contain (ask-thread-container.tsx line 244). |
| M151-R3 | PASS | ui-case-M151-R3-D.txt, ui-case-M151-R3-M.txt: panel 0 after navigation, not locked, pointer-events auto, link hit, probes 0. |
| M151-R4 | FAIL | ui-case-M151-R4-sizes.txt: geometry passes (1280x560 h 528, 1024x700 400x600, 320x640 full width without overflow), but the title is truncated at every size, "Ask about Dense His..." (M151-R4-1280x560.png) and "Ask abou..." at 320 (M151-R4-320x640.png). |
| M77-G1 | FAIL | ui-case-M77-G1-D.txt, ui-case-M77-G1-M.txt: the flow passes (answer, chip to report, back keeps the item), but M77-G1-D-ask and M-ask probes violations 1, flashes ["Which reports do I have?"] (draft cleared on send), not named. The chip label repeats the date (M77-G1-answer-D.png). |
| M77-G2 | FAIL | ui-case-M77-G2-D.txt, ui-case-M77-G2-M.txt: placement right (aside left 1037 after thread right 997; sheet at M), but the empty "Select a cited value to see it here." paints before the fact: M77-G2-M-chip.probe.json violations 3 (flashes "SPAN ","SPAN ","DIV "), M77-G2-D-chip.probe.json violations 1. |
| M77-G3 | FAIL | ui-case-M77-G3-D.txt: D passes (4, 3, 2, "1 question left", out copy, input disabled, one debit in be-M77-G3.txt, probe 0), but no M file exists, not confirmable at 390. |
| M77-G4 | PASS | ui-case-M77-G4-D.txt, ui-case-M77-G4-M.txt: flagged copy, Cancel keeps the chat, confirm empties it to the exact copy, question rows unchanged (19/19, 18/18), probes 0. |
| M77-G5 | FAIL | ui-case-M77-G5-D.txt, ui-case-M77-G5-M.txt: card right (title, body, 1 data-built suggestion), but be-M77-G5.txt has 4 "model: 'claude-haiku-5-5'" lines tied to the year-review intro on Home load (be-M159-R1-home-ui.txt); "no new Claude line on Home load" fails. |
| M77-G6 | FAIL | ui-case-M77-G6-D.txt, ui-case-M77-G6-M.txt: exact refusal copy, dashed block, 0 answers, 0 chips, questions left 18, but probes violations 2 each, flashes of the typed drafts, not named. |
| M77-G7 | PASS | ui-case-M77-G7-D.txt, ui-case-M77-G7-M.txt: one Hindi line above the input (707 above 715 at D, 664 above 672 at M), 0 in English; M77-G7-hi-M.png confirms. |
| M77-G8 | FAIL | ui-case-M77-G8-D.txt, ui-case-M77-G8-M.txt: isolation works both ways, but M77-G8-D-switch and M-switch probes violations 8, forbiddenPainted ["How many mg should I take?"] from t 32 to 232 ms (before the switch lands at 288 ms; probe likely armed early). |
| M77-G9 | FAIL | ui-case-M77-G9-D.txt: gate works (consent text, box unticked, input disabled, 403 with the exact title, answered after the tick), but M77-G9-D-consent.probe.json violations 3 (pending article and draft flashes) with settled:false; the Probe line names no transient. |
| M77-G10 | FAIL | be-M77-G10.txt: "0 sampled", so no item, cited facts or key line printed; step 3 shows "Exit status 1" with no usage line, then "exit: 0"; not confirmable. |
| M77-G13 | PASS | ui-case-M77-G13-widths.txt: column at most 72ch at every width and equal at 1440 and 1920, 358 = 390 - 32, chips 44 or more, composer 744 above the bar, resizes-content set, no overflow. Plan's "equal from 768" cannot hold with the 240 px sidebar. |
| M77-R1 | PASS | ui-case-M77-R1-D.txt, ui-case-M77-R1-M.txt: B12 chip a button, pattern chip a link with lab and date, HbA1c a span, two "Report deleted" spans with no href. |
| M99-G3 | FAIL | ui-case-M99-G3-D.txt, ui-case-M99-G3-M.txt: chip texts right and the URL gets #pattern-b12_deficiency, but foldOpen null: REPORT_FULL has no patterns fold, so the link lands on a dead hash; probes violations 1, flashes ["DIV Loading"], not named. |
| M77-R4 | FAIL | ui-case-M77-R4-D.txt: paused copy, 0 new items, emergency copy right, but M77-R4-D.probe.json violations 1, forbiddenPainted ["[data-testid=assistant-answer]"] from t 10 (before the send; probe likely armed on old answers); no DB row check. |
| M77-R5 | FAIL | ui-case-M77-R5-D.txt, ui-case-M77-R5-M.txt: double click plus double Enter gave 4 posts and 4 new items at D and M (expected 1), M77-R5-page-D.png shows repeated "How many mg?" bubbles, probes settled:false; step 4 refusal not recorded, step 7 question never sent. |
| M77-R6 | PASS | be-M77-R6.txt: 6 x 201 and 2 x 429 with the exact copy; rows 1 to 7 (6 new, equal to the 201 count). |
| M77-R7 | PASS | be-M77-R7.txt: 404 "We could not find this report", rows 0 before and after. |
| M77-G11 | FAIL | ui-case-M77-G11-widths.txt: sheet at 1280, 1279 and 390, Escape order right, but the probes at 1280, 1279 and 390 have violations 2 each, flashes ["SPAN ","DIV "]: the empty "Select a cited value to see it here." shows about 51 ms before the fact. |
| M77-G12 | PASS | ui-case-M77-G12-widths.txt: at 1279 sheet 1 and aside 0, at 1280 aside 1 and sheet 0. |
| M169-G1 | PASS | ui-case-M169-G1-widths.txt: left equals right at 360, 390, 430 (16/16) and 600 (76/76); widths 328, 358, 398, 448; maxWidth 448px; M169-G1-*.png show a centred bar. |
| M169-G2 | PASS | ui-case-M169-G2-S.txt, ui-case-M169-G2-M.txt: 6 labels, 11 to 12 px, 1 line, scrollWidth equals clientWidth, inside the link, Upload aria-label "Upload a report". |
| M169-G3 | FAIL | ui-case-M169-G3-M.txt: static state right (one active link, alpha 0.1, radius 16, no dot), but no probe exists for the /trends to /settings route change, so the forbidden "two active tabs" is not confirmable. |
| M169-G4 | PASS | ui-case-M169-G4-widths.txt: gap 10, inset 16, 0 tab hits at 360, 390, 600; bar hidden with launcher bottom 16 and inset 16 at 800 and 1280. (Launcher over page content is graded under M151-G10.) |
| M169-G5 | PASS | ui-case-M169-G5-widths.txt, M169-G5-360.png: 6 Hindi labels on 1 line, no clip, inside the link at 360 and 390 (and 320); insets 16/16. |
| M169-G6 | PASS | ui-case-M169-G6-S.txt, ui-case-M169-G6-M.txt: circle 48x48 raised 12 px, centre equals link centre, label inside the bar, click opens /reports/upload, M169-G6-*.probe.json violations 0. |
| M169-R1 | PASS | ui-case-M169-R1-widths.txt: 0 wraps or clips at 360 in en and hi; 320 also 0 failures (narrowest recorded, link width 45). |
| M169-R2 | PASS | ui-case-M169-R2-states.txt: 0 tab hits in every bar state at S and M, launcher bottom constant (708 and 752), probes 0. |
| M169-R3 | PASS | ui-case-M169-R3-M.txt: sidebar Home, Reports, Trends, Profiles, Settings; bar display none at 768 and 1280, block at 767; bottom padding 96px at 768 and 152px at 390. |
| M152-G1 | PASS | ui-case-M152-G1-M.txt: fixed, insets 16, full radius, 1px border, blur(12px), shadow, alpha 0.92, 6 hrefs right, bar present after every click; the two probe violations are flashes ["DIV Loading"] in M152-G1-M_reports and _trends.probe.json, the named transient "the route load". |
| M152-G2 | FAIL | ui-case-M152-G2-M.txt: hover alpha 0.05 and cancel stay on /reports, but the press reads pressTransform "none", not a scale of 0.85 to 0.95; the press state is not confirmed (the harness read transform, not scale). |
| M152-G3 | FAIL | M152-G3-M.probe.json: violations 1, settled:false (header class mutation at 1958 ms); the machine values in ui-case-M152-G3-M.txt are right (top 762 to 860 to 762, no toggle on 6 px). |
| M152-G4 | FAIL | M152-G4-M.probe.json: violations 7, flashes ["SPAN ","SPAN ","SPAN ","SPAN ","DIV Loading","DIV Loading"], settled:false; only the bar slide is a named transient; the dom-check otherwise holds. |
| M152-G5 | FAIL | ui-case-M152-G5-M.txt: on /trends footer bottom 2315 is below bar top 762 at the end of the scroll and the last footer link is not hit at its centre (lastLinkHit false); /, /reports and /settings pass. |
| M152-G6 | FAIL | ui-case-M152-G6-M.txt: maxEvent 504 ms (budget 250, finding band ends at 500) and maxLongTask 413 ms, above the forbidden 300 ms long task. |
| M152-R1 | PASS | ui-case-M152-R1-M.txt: lowest contrast 5.19 (active Home, light); inactive 5.75 light and 7.23 dark, active 7.72 dark, all above 4.5. |
| M152-R2 | PASS | ui-case-M152-R2-M.txt: testid mobile-tab-bar, nav "Main", names Home, Reports, Upload a report, Trends, Family, Settings in order. |
| M148-G3 | PASS | ui-case-M148-G3-D.txt, ui-case-M148-G3-M.txt: default buttons radius 8px with a shadow, outline, ghost, secondary and destructive without, weight 600, no text transform on 5 pages at D and M. |
| M148-G4 | FAIL | ui-case-M148-G4-D.txt: press gives translate "0px 1px" and no sheet opens (probe 0), but under reduced motion translate stays "0px 1px" where 0 is expected. |
| M148-G5 | BLOCKED | no evidence: no file in qa/ or logs/ for the verb label check. |
| M148-G7 | FAIL | ui-case-M148-G7-D.txt, M156-G1-D.png: at 1280 the report header actions wrap to 3 rows with ragged left edges (844, 832, 1073) and Delete report sits alone on its own row; primary count is 0 on the report page. |
| M148-R3 | FAIL | ui-case-M148-R3-D.txt, ui-case-M148-R3-landing-D.txt: 0 matches on 14 app views and 3 landing pages, but not confirmable: step 3 (failed report "Upstream error" and the admin label) has no evidence and the M viewport was not run. |
| M148-R4 | BLOCKED | no evidence: no contrast file for the button variants in qa/ or logs/. |
| M148-G8 | FAIL | M148-G8-D-pick.probe.json and M148-G8-M-pick.probe.json: violations 1 each, flashes ["15 Oct 2026"], not the named skeleton transient; the rest of ui-case-M148-G8-*.txt holds. |
| M148-G9 | FAIL | ui-case-M148-G9-M.txt: not confirmable at M, the export tab rendered at vw 1200 and M148-G9-M.png is the same 1200 px frame as D; at D the values, Download PDF and launcher 0 hold. |
| M148-G10 | FAIL | ui-case-M148-G10-D.txt, ui-case-M148-G10-M.txt: create, Copied, anonymous view, toast and ended page pass, but not confirmable: steps 8 and 9 (expired link) and the token_hash and ended_at SQL have no evidence. |
| M148-G11 | FAIL | M148-G11-D-switch.probe.json and M148-G11-M-switch.probe.json: violations 9, flashes ["English","SPAN ",...,"हिन्दी","DIV [data-radix-select-viewport]..."]; only "English for at most 300 ms" is named. The dom-check passes. |
| M148-G12 | FAIL | ui-case-M148-G12-D.txt, ui-case-M148-G12-M.txt pass in the UI, but be-M148-G12.txt prints no consent, profile or report row counts and no sha256(user id) comparison, only the deletion_log rows; not confirmable. |
| M153-G1 | PASS | ui-case-M153-G1-D.txt, ui-case-M153-G1-M.txt, M153-G1-M.png: all six lines, the version line, the footer company line, noOverflow at both. |
| M153-G2 | PASS | ui-case-M153-G2-D.txt, ui-case-M153-G2-M.txt: 3 pages carry business, proprietor, email, phone, brand and version; grievance line on Privacy; probes 0. |
| M153-G3 | FAIL | ui-case-M153-G3-D.txt, ui-case-M153-G3-M.txt: content, hrefs and grid pass, but every About policy link is 17 px high (under 24, hit area). |
| M153-R1 | PASS | ui-case-M153-R1-D.txt, ui-case-M153-R1-landing-D.txt: no bracket placeholder, titles and manifest say MediWise. |
| M153-R3 | PASS | ui-case-M153-R3-D.txt, ui-case-M153-R3-M.txt: no GSTIN, address or street; the only regex hit "Mumbai" on /privacy is the data-region sentence (policies.ts:126), not a postal address; plan regex too wide. |
| M153-R4 | PASS | ui-case-M153-R4-*.txt: app and auth footers have links and no company line, the policy footer has it; app footer links 28 px and wrap inside 390. |
| M159-G8 | FAIL | ui-case-M159-G8-sizes.txt: noOverflow false at M with 200 percent text (scrollWidth 480 vs 390) and 320 at 200 percent (480 vs 320); at 320 at 200 percent "Upload a report" sits outside 5 family rows; the emoji-first profile shows a replacement box glyph in the switcher avatar (M159-G8-emoji-M.png); at M 200 percent the header name overlaps the theme button and the avatar (M159-G8-long-M-200pct.png). |
| M159-G9 | FAIL | ui-case-M159-G9-sizes.txt: the balance reads "1284 reports left" with no thousands separator on upload, /credits and Settings at D, M and 320, Expect asks for 1,284 (finding F9); empty states, no NaN and noOverflow at 320 hold. |
| M159-R5 | FAIL | ui-case-M159-R5.txt: Recent reports reads "29 Mar 2025 · 1 files" at D and M (finding F7). Fixed on branch: ui-case-M159-R5-after-fix.txt shows "1 file" and ui-case-M159-R5-reportlist-after-fix.txt shows "1 marker". The family "1 marker at risk" line was never exercised (the profile had 8). |
| M156-G9 | FAIL | ui-case-M156-G9-sizes.txt: at 200 percent text the page overflows (D scrollWidth 1567 vs 1280, M 480 vs 390, 320 480 vs 320), 4 or 5 header actions are outside the viewport, the lab line runs past the card at D 200 percent (M156-G9-D-200pct.png); the 100 percent sizes and the "60 of 60 characters" counter pass. |
| M151-G12 | FAIL | ui-case-M151-G12-sizes.txt: at 320 the panel title is cut to "Ask abou..." with no part of the name visible (clientWidth 84 of scrollWidth 742, M151-G12-panel-320.png); no 200 percent measurement; bubble wrap measured at D only; no probe file for the send. |
| M157-G7 | FAIL | ui-case-M157-G7-sizes.txt: at 200 percent the page overflows (D 1427 vs 1280, M 491 vs 390, 320 491 vs 320); the "hi" screenshots render in English, so the Hindi leg did not run (M157-G7-hi-320.png); at M 200 percent the header name collides with the theme and avatar controls. |
| M149-G6 | FAIL | ui-case-M149-G6-sizes.txt: at 320 the tile number "1,23,640" overflows its box (scrollWidth 115 > clientWidth 104), the forbidden clipped number; en-IN grouping and noOverflow hold. |
| M165-R7 | FAIL | ui-case-M165-R7-sizes.txt: sign-up succeeds and 100 percent sizes are clean, but at 200 percent noOverflow is false (D 1421 vs 1280, M 542 vs 390, 320 542 vs 320), the user menu right edge is at 480 on a 320 or 390 screen, and Settings overflows (1584, 503, 503). |
| M149-G2 | PASS | ui-case-M149-G2-D.txt, ui-case-M149-G2-M.txt: description exact, section order holds with the 24 px gap at D and M, totals match the API in en-IN, ₹5,373 shown, headers exact, dollar 0. |
| M149-G3 | FAIL | ui-case-M149-G3-D.txt, ui-case-M149-G3-M.txt: not confirmable; #admin-from max read null and was never read with #admin-to set; the inverted-range API result {"status":200,"empty":0} does not show empty lists; the first per-user run read rowsUsers [] (recheck ui-case-M149-G3-userfilter.txt passes). |
| M149-G4 | PASS | ui-case-M149-G4-D.txt, be-M149-G4.txt, M149-G4-D-retry.probe.json (violations 0): row shows "No credits left" with date and id, no cost, retry 204, toast, row gone, report done, owner credit 1 to 0. D only. |
| M149-G5 | PASS | ui-case-M149-G5-D.txt, ui-case-M149-G5-M.txt: 5 columns with equal 186 px tiles at D, 2 columns with 173 px tiles at M, table scrolls inside its wrapper at M (599 > 356, overflow-x auto), numbers right-aligned, noOverflow at both. |
| M149-R3 | FAIL | ui-case-M149-R3-D.txt, ui-case-M149-R3-M.txt: behaviour correct (Not Found 1, Operator 0, breadcrumb 0, admin links 0), but M149-R3*.probe.json violations 1, badRequests [{url /admin/failed-reports, status 404}], and the Probe line names only "skeleton". Harness gap: the 404 is what the Expect line requires; graded FAIL under the strict probe rule, same as M149-R4. |
| M149-R2 | PASS | ui-case-M149-R2-D.txt, ui-case-M149-R2-M.txt: matches [] and spendRequests [] at both viewports. |
| M149-R5 | FAIL | ui-case-M149-R5-D.txt: the refetch answered 404, but error 0 and retry 0; M149-R5-after-D.png shows a blank Operator page (forbidden "a blank page") with no "The credit history did not load." text; the probe (0) did not catch it. |
| M151-R1 | PASS | ui-case-M151-R1-D.txt, ui-case-M151-R1-M.txt: enabled false, launcher 0, ask card 0, ask link 0, assistant-off copy, API 404, M151-R1-D-home and M-home probes 0; M151-R1-M.png confirms. |
| M149-R4 | FAIL | M149-R4-D.probe.json: violations 1, badRequests [{url /admin/failed-reports, status 404}]; the Probe line names only "skeleton". Behaviour is correct (M149-R4-D.png Not Found, be-M149-R4.txt three 404, no costCents): harness gap, the 404 is the answer the Expect line requires, but the strict probe rule applies. |
| M97-G1 | PASS | ui-case-M97-G1-D.txt, ui-case-M97-G1-M.txt: lang en, h1 "Page not found" 60px (D) and 48px (M) in Instrument Serif, robots noindex, home link to /, styled page; be-M97.txt status 404. |
| M97-G2 | PASS | ui-case-M97-G2-D.txt, ui-case-M97-G2-M.txt: lang hi-IN, h1 "पेज नहीं मिला", link to /hi, switch "English" to /, Devanagari font; be-M97.txt status 404. |
| M97-G3 | PASS | ui-case-M97-G3-D.txt: no Instrument Serif request or loaded family on /hi, serif requested and loaded on /. Plan grep count 0 is wrong for the code: both matches in be-M97.txt are the shared inline @font-face, not a request. |
| M97-R1 | PASS | ui-case-M97-R1-D.txt: 4 of 4 paths show the right 404 and lang; the only Devanagari on English pages is the switch label; no "Page not found" on Hindi pages. |
| M97-R2 | PASS | ui-case-M97-G1-*.txt, ui-case-M97-G2-*.txt (no file named for this id): main 480 of 800 (D) and 506 of 844 (M, 60vh), h1 and link left edges 122/122 and 16/16, link 40 px, h1 not clipped, noOverflow true; M97-G1-D.png and -M.png show the full-width footer. |
| M160-G1 | PASS | ui-case-M160-G1-D.txt, ui-case-M160-G1-M.txt: eyebrow, h1, both hrefs, "Prices include tax.", 2 disclaimers, band cells "20 files", "137 markers", "5 file types", no city. |
| M160-G2 | PASS | ui-case-M160-G2-D.txt (gap 64, radius 12px, 3 columns, band left 122) and ui-case-M160-G2-M.txt (gap 48, edge to edge, 1 column), noOverflow at both; M160-G2-D.png confirms. |
| M160-G3 | PASS | ui-case-M160-G3-D.txt, ui-case-M160-G3-M.txt: 5 trust titles, 7 questions in order, none open on load, 14 M160-G3-*-q*.probe.json all 0 with single-open accordion. |
| M160-G4 | FAIL | ui-case-M160-G4-D.txt: at 1280 the three phone tops are 1743, 1815 and 1767, a spread of 72 px against "within 2 px" (alignment); M passes (stacked, width 260, centre 195). |
| M160-G5 | PASS | ui-case-M160-G5-D.txt, ui-case-M160-G5-M.txt: equal rows (288 x3, 238 x3), wide cells 510 = 2 x 247 + 16, icons centred (dx 0, dy 0), no clip, noOverflow; M160-G5-D.png confirms. |
| M160-G6 | PASS | ui-case-M160-G6-D.txt, ui-case-M160-G6-M.txt: gst 0, badge, equal card heights 234 and tops 7296 at D, stacked at M, noOverflow; tax line visible in M160-G6-D.png. |
| M160-G7 | PASS | ui-case-M160-G7-D.txt: history heading present, "plain English" 0, "plain language" 2. |
| M160-G8 | PASS | ui-case-M160-G8-D.txt, ui-case-M160-G8-M.txt: header and footer hrefs, footer company line, pricing jump top 80 below header 56 (probe 0), switch to /hi; nav hidden at M with Sign in and Read my report visible, noOverflow. |
| M160-G9 | PASS | be-M160-G9.txt: lang, og:locale en_US and hi_IN, description without India, sitemap with alternates, robots, Organization without address; hreflang en, hi-IN, x-default present in the served out/index.html (the grep missed hrefLang). |
| M160-G14 | PASS | ui-case-M160-G14-D.txt, -M.txt, -hi-D.txt, -hi-M.txt: 2 rows with overflow hidden, chips 36px nowrap, duplicate track hidden 2, pause 32 px, noOverflow true in both languages. |
| M160-R3 | PASS | ui-case-M160-R3-D.txt: no bad match in en or hi; India only in the pricing line; band clean. F4 "Mumbai, India" stays in the closed FAQ answer. |
| M160-R4 | PASS | ui-case-M160-R4-D.txt: eyebrow, price, device and pricing strings present in Hindi, no Latin runs, M noOverflow; M160-R4-hi-M.png wraps inside the container. |
| M160-R5 | PASS | ui-case-M160-R5-D.txt: no diagnose, detect or risk-score match in en or hi; explains, shows, tracks present. |
| M160-R6 | FAIL | M160-R6-D-pause.probe.json: violations 2, flashes ["svg ","svg "] at t 152 ms after the Pause motion click (icon swap); the Probe line names no transient. State checks pass (paused, kept after reload, none under reduced motion). |
| M165-G7 | PASS | ui-case-M165-G7-D.txt, -M.txt, -hi-D.txt, -hi-M.txt: h1, intro, six controls, report section, SECURITY.md link, lang en and hi-IN, 3 columns at D and 1 at M, noOverflow. The 640 to 1023 two-column width was not run; F6 switch links to /hi. |
| M165-G8 | PASS | ui-case-M165-G8-D.txt, ui-case-M165-G8-M.txt: 15 h2 in order, 6 recipients with countries, "Version 2026-10-15. Last change: 15 October 2026.", breach 72 h, adult. |
| M165-G9 | PASS | ui-case-M165-G9-D.txt, ui-case-M165-G9-M.txt: "Not a medical device" section, 18 or older, rupees. |
| M165-R5 | PASS | ui-case-M165-R5-D.txt: "Stored in India" 0 in en and hi. |
| M160-G10 | FAIL | LAND-story-chromium.json: at 1280 the sticky phone is not fully in the viewport, step 1 spans 291 to 902 (viewport 800), step 4 top -85; activeIndex, opacity and scrollWidth pass; the 390 leg passes. |
| M160-G11 | FAIL | LAND-story-webkit.json (WebKit 26.6): same defect at 1280, step 1 bottom 933 > 800, step 4 top -117 < 0; everything else passes at both widths. |
| M160-R7 | PASS | LAND-story-chromium.json: down sequence 0000000011122233333333 and up 3333333222111000000000 monotonic, min max opacity 1, no overlap after Bento. |
| M160-R8 | PASS | LAND-story-webkit.json: monotonic both ways, min max opacity 1, no overlap; 11 images complete at 390. |
| M169-G7 | FAIL | ui-case-M169-G7-webkit.txt: the hi_S and hi_M legs read English labels ("Home", "Reports"), M169-G7-webkit-hi-S.png shows English UI; Hindi fit in WebKit not confirmable. English legs pass (insets 16/16, one line). |
| M152-G7 | PASS | ui-case-M152-G7-webkit.txt: backdropFilter and webkitBackdropFilter "blur(12px) saturate(1.4)", bar hides on scroll down (top 860) and shows on scroll up (762). |
| M161-G2 | PASS | ui-case-M161-G2-D.txt, ui-case-M161-G2-M.txt: Bluepine lab, hba1c 5.9, bun 18, creatinine 0.92, egfr 82 with CKD-EPI 2021, Not recognised holds GLUCOSE 115 (flag stripped), "7 of 15", score 73. |
| M161-G3 | PASS | ui-case-M161-G3-D.txt, ui-case-M161-G3-M.txt, be-M161-db.txt: every printed and canonical pair matches, CKD-EPI 2009, 19 scored, score 89; DB stores hemoglobin 12.8 g/dL (printed 128 g/L) and hba1c 6.2 % (printed 44 mmol/mol). |
| M161-G4 | PASS | ui-case-M161-G4-D.txt, ui-case-M161-G4-M.txt: Laborzentrum Mittelfeld, 3 Feb 2025, decimal commas read right, bun null (Vorwert not read), "10 of 16", score 83. |
| M161-G5 | PASS | ui-case-M161-G5-D.txt, ui-case-M161-G5-M.txt, M161-report-AU-D.png: one HbA1c row at 6.6 %, conversions match, egfr >90 with CKD-EPI 2021, score 76 equals the golden. Note: be-M161-db.txt stores 2 hba1c rows for AU, the page shows one. |
| M161-G6 | FAIL | ui-case-M161-G6-G8.txt: equations correct (US 2021, UK 2009, AU 2021), but the Probe line names "blank page after the row click" and the file says "PROBE: n/a" (no probe), and the -D screenshots it lists do not exist; D leg not confirmable. |
| M161-G7 | FAIL | ui-case-M161-G7.txt, M161-G7-hba1c-M.png: at M each chart has 2 points in one unit; the D leg is not confirmable, the M161-G7-*-D.png files the case lists do not exist. |
| M161-G8 | FAIL | ui-case-M161-G6-G8.txt, M161-marker-UK-hba1c-M.png: values match (44 mmol/mol with 6.2 %), but at 390 the breadcrumb current item "HbA1c" is cut to "Hb..." and the parent to "14 Mar 2025 · blood panel (19 ..." (truncation); D screenshots missing. |
| M161-G9 | PASS | be-M161-db.txt and the ui-case headers: US 4 Mar 2025, UK 14 Mar, DE 3 Feb, AU 14 Mar, date_ambiguous false on all four, no notice. |
| M161-R1 | PASS | be-M161-db.txt, ui-case-M161-G2 to G5: hba1c US 5.9, UK 6.2, DE 5.8, AU 6.6, one page row per report. |
| M161-R2 | PASS | be-M161-db.txt: US has bun 18 and no blood_urea; UK, DE and AU have blood_urea 31, 32, 37 and no bun. |
| M161-R4 | FAIL | be-M161-db.txt "R4 API": US egfr (82, None), labRange null where low 60 is expected from the printed "> OR = 60"; the US eGFR marker page says "The report shows no lab range." (M161-marker-US-egfr-M.png). |
| M161-R5 | PASS | ui-case-M161-R5.txt: Home at D and M shows "HbA1c, 14 Mar 2025, 6.2%" with canonical 0; Trends for UK Sample is the one-report empty state, one-unit Trends is covered by M161-G7. |
| M155-G6 | FAIL | ui-case-M155-G6-*.txt: unique names and rank order hold on both profiles (14 and 5 rows), noOverflow holds, but not confirmable: the chip filters and the row layout measurements were not recorded. |
| M156-G8 | PASS | ui-case-M156-G8-*.txt: Arjun score 89, Findings 6 open, every fold "<Title> <count>", sticky nav at D and static at M, Studies 1; Meera's study report opens Linked reports by default when links exist (report-container.tsx line 211); dev-blocked-writes.json empty, dev-api.log GET only. |
| M157-G6 | FAIL | ui-case-M157-G6-*.txt: chips, URL and pressed state work, but the doctor-line check is not confirmable: suggestion text read empty (Arjun notEnding 84 of 84; Meera 0 at D, 3 at M on the same data); the M157-R1 regex was not recorded. |
| M159-G7 | PASS | ui-case-M159-G7-*.txt: exactly 1 disclaimer per block, apiDisclaimerOk true, doseHits [], rows per kind match the API (Arjun 1 doctor and 4 habits, Meera 2 and 1). |
| M158-G4 | PASS | be-M158-G4.txt {"own":200,"unknown":404,"anon":401}, confirmed in logs/dev-api.log. |
| M169-G8 | PASS | ui-case-M169-G8-360-S.txt, ui-case-M169-G8-390-M.txt: insets 16/16 and 6 of 6 labels on one line at 360 and 390 (M169-G8-360.png); the launcher half is blocked by assistant off on dev. |
| M151-G11 | BLOCKED | assistant off on dev: ui-case-M151-G11-D.txt shows assistant.enabled false, launcher 0, posts 0. |
| M153-G5 | PASS | ui-case-M153-G5-D.txt, ui-case-M153-G5-M.txt: "MediWise is a brand of Codegenix.", Brand, Company and Email, links /terms, /privacy, /refunds, /contact, noOverflow at both. |
| M149-R6 | PASS | ui-case-M149-R6-D.txt: notFound 1, operator 0, dollar false; dev-api.log shows GET /admin/failed-reports 404 and no write request. |
| M148-G15 | FAIL | ui-case-M148-G15-D.txt, ui-case-M148-G15-M.txt: link-variant buttons on Home have font weight 500 where Expect asks 600 on every button; only 4 of 5 pages measured (no report page); textTransform not recorded. |
| M97-G5 | FAIL | ui-case-M97-G5-D.txt, ui-case-M97-G5-M.txt, be-prod.txt: production styled 404 in en and hi (status 404) confirmed, but not confirmable: no production font request log for the serif-on-/ and none-on-/hi check (only a grep count 2). |
| M160-G12 | PASS | ui-case-M160-G12-D.txt, ui-case-M160-G12-M.txt: production eyebrow, gap 64 (D) and 48 (M), no city, international trust copy, Codegenix footer, gst 0, noOverflow. |
| M160-G13 | FAIL | qa/prod-story/LAND-story-chromium.json and LAND-story-webkit.json (no file named for this id): the 1280 sticky phone repeats the M160-G10 and G11 defect (Chromium 291 to 902 and top -85; WebKit bottom 933 and top -117). The JSONs carry no URL and match the local JSONs exactly, so the production origin is not shown either. |
| M165-G10 | PASS | ui-case-M165-G10-D.txt, ui-case-M165-G10-M.txt, be-prod.txt: production /security and /hi/security 200 with six controls, report item, SECURITY.md link, noOverflow. |
| M153-G6 | PASS | ui-case-M153-G6-D.txt, ui-case-M153-G6-M.txt: 4 production policy pages at both viewports show business, proprietor, email, phone and version 2026-10-15. |
| M165-G11 | NOT DEPLOYED | ui-case-M165-G11-D.txt, ui-case-M165-G11-M.txt: both boxes present and unchecked, but production reads "I agree MediWise stores my health reports and uses an AI service to read them, as the Privacy policy describes."; the HEAD label (Anthropic in the United States) is not deployed. |
| M148-G13 | PASS | ui-case-M148-G13-D.txt, ui-case-M148-G13-M.txt: Google button above the divider on /login and /signup, width equal to the form (372/372 D, 310/310 M). |
| M148-G14 | PASS | ui-case-M148-G14-D.txt, ui-case-M148-G14-M.txt: final host accounts.google.com through the Supabase auth host, title "Sign in - Google Accounts"; M148-G14-M.png confirms. |
| M160-R9 | FAIL | be-prod.txt (no file named for this id): sitemap 4 loc lines, robots, lang en, og:locale, hreflang and Organization with legalName Codegenix, but not confirmable: the sitemap alternates were not recorded (only <loc> lines kept). |
| M171-R1 | FAIL | be-M171-R1.txt: steps 1, 2, 4, 5 clean (0 error lines, 0 mail lines, 0 inbucket, no secret), but step 3 is not "0 unexpected": 44 of 156 probes have violations, none classified, including status 500 on /auth/v1/signup (M165-R6) and settled:false (M151-G6-D, M152-G3-M, M152-G4-M, M77-G9-D-consent, M77-R5 double). |
| M171-G1 | PASS | be-M171-G1.txt: git status -s shows only "?? docs/qa/" (nothing under apps, packages or supabase); 0 listeners on 3101, 5273, 3100 and 3102; Supabase e2e up (API_URL http://127.0.0.1:54321); env copies removed. The one commit 6fd273b (F7 fix) is allowed by the ticket. |
