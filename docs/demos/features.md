# Feature demos

This document lists every feature of MediWise on 2026-10-14 (main after MEDI-100). Each feature gets one short video. For each feature you find what it does in plain words, where to start, the data it needs, the screen size to record and the narration script.

The recording sessions use the `record-flow` skill. The narration script of each feature is the list of `caption()` lines for that skill.

## Recording order

Record the groups in this order. Inside a group, record the features in the order of the slug table.

1. **Onboarding.** What a new person sees, from the landing page to the first report and the finished profile.
2. **The report pipeline.** Upload, the report page and everything on it.
3. **History.** Home, family profiles and every feature that looks across reports.
4. **Export and sharing.** What a person gives to a doctor.
5. **Settings and account.** Name, profile, language, credits, policies and account deletion.
6. **The operator page.** Only the admin account sees it.
7. **The assistant.** Off on dev by default. Record it with the flag on.

## Slugs

The recording tickets use these slugs. **Both** means desktop 1920 x 1080 and phone 390 x 844. The ticket asks for both sizes on upload, install, Home and the report page only.

| # | Slug | Feature | Group | Account | Viewport |
| - | - | - | - | - | - |
| 1 | `landing-page` | Landing page in English and Hindi | Onboarding | none | Desktop |
| 2 | `sign-up-email` | Create an account with email | Onboarding | throwaway | Desktop |
| 3 | `google-sign-in` | Sign in with Google | Onboarding | demo | Desktop |
| 4 | `sign-in-and-reset` | Sign in and reset a password | Onboarding | demo, throwaway | Desktop |
| 5 | `upload-first-report` | First upload, with the date of birth taken from the report | Onboarding | throwaway | Both |
| 6 | `complete-profile` | Complete the profile, with the date of birth from the report | Onboarding | throwaway | Desktop |
| 7 | `app-navigation` | Sidebar, profile switcher and keyboard shortcuts | Onboarding | demo | Desktop |
| 8 | `install-app` | Install MediWise on the home screen | Onboarding | demo | Both |
| 9 | `offline-and-update` | Offline screen and app update | Onboarding | demo | Desktop |
| 10 | `upload-report` | Upload many files, with photo checks | Report pipeline | throwaway | Both |
| 11 | `report-page` | The report page | Report pipeline | demo | Both |
| 12 | `report-tabs` | Markers, follow-ups, unmeasured and doctor questions | Report pipeline | demo | Desktop |
| 13 | `marker-page` | One marker explained | Report pipeline | demo | Desktop |
| 14 | `report-studies` | Scan and ECG reports kept with the blood values | Report pipeline | demo | Desktop |
| 15 | `rename-report` | Report titles and rename | Report pipeline | demo | Desktop |
| 16 | `visit-notes` | Notes for this visit | Report pipeline | demo | Desktop |
| 17 | `home-dashboard` | Home | History | demo | Both |
| 18 | `family-profiles` | Family profiles | History | demo | Desktop |
| 19 | `consent-follow-up` | Confirm your family profiles | History | demo | Desktop |
| 20 | `retest-reminders` | Due for retest, with a calendar file | History | demo | Desktop |
| 21 | `reports-list` | Reports list | History | demo | Desktop |
| 22 | `trends` | Trends of every marker | History | demo | Desktop |
| 23 | `trend-detail` | One marker over time | History | demo | Desktop |
| 24 | `compare-reports` | Compare two reports | History | demo | Desktop |
| 25 | `episodes` | Episodes | History | demo | Desktop |
| 26 | `year-in-review` | Year in review | History | demo | Desktop |
| 27 | `auto-link-repeat` | Report links and auto-link of a repeat study | History | throwaway | Desktop |
| 28 | `second-opinion-settled` | Second opinions and settled alerts | History | demo | Desktop |
| 29 | `doctor-export` | Doctor export as PDF | Export and sharing | demo | Desktop |
| 30 | `share-with-doctor` | Share a report with a link | Export and sharing | demo | Desktop |
| 31 | `open-shared-link` | What the doctor sees from a link | Export and sharing | none | Desktop |
| 32 | `download-data` | Download all values (CSV) and my data | Export and sharing | demo | Desktop |
| 33 | `settings-account` | Settings | Settings and account | demo | Desktop |
| 34 | `hindi-language` | MediWise in Hindi | Settings and account | demo | Desktop |
| 35 | `report-credits` | Report credits | Settings and account | demo | Desktop |
| 36 | `policy-pages` | Terms, privacy, refunds and contact | Settings and account | none | Desktop |
| 37 | `delete-account` | Delete the account | Settings and account | throwaway | Desktop |
| 38 | `operator-page` | The operator page | Operator | demo as admin | Desktop |
| 39 | `ask-about-reports` | Ask about your reports | Assistant | demo | Desktop |
| 40 | `ask-chat-controls` | Questions left, wrong answers and clear chat | Assistant | demo | Desktop |

Three routes get no video. `/design` and `/dev/kitchen-sink` are developer pages. `/auth/callback` has no screen of its own: it finishes the Google sign-in (feature 3) and the links in auth emails.

## Demo data on mediwise-dev

Checked through the API on 2026-10-14.

| Account | Profile | What it holds |
| - | - | - |
| `arjun.demo@example.com` (the demo account) | Arjun Mehta, you | Two reports from the golden fixtures in `apps/api/fixtures/golden`: `9 Mar 2024 · blood panel (109 markers)` and `29 Mar 2025 · blood panel (109 markers), ultrasound`. The 2025 report has a visit note and an ultrasound study. A year in review exists. No episode. |
| Same account | Meera Mehta, partner | Five reports from `apps/api/fixtures/episode`, 3 Feb to 17 Mar 2025. They form the open episode `Hormone tests`. The 10 Feb ultrasound shows a cyst. The 17 Mar repeat ultrasound is linked to it as a repeat by MediWise, so the 10 Feb report shows the cyst under Settled. |
| Same account | Account | 4 report credits. Language English. Not linked to Google. |
| A throwaway account (see Setup) | Made for the recordings | Starts empty. Used for the flows that change or delete data. |

Missing data. Each feature below says what it needs. In short:

- **Retest rows on Home.** No demo report has HbA1c, eGFR or urine ACR at watch or risk, so "Due for retest" does not show. No fixture gives one.
- **Consent prompt on Home.** Every family profile on the demo account is confirmed. The prompt needs a profile with no confirmation date.
- **Photo checks.** No photo fixture exists. Make the photos off camera from a golden PDF (see feature 10).
- **Auto-link on camera.** The demo link already exists. A new link needs the two study fixtures in `apps/api/fixtures/studies` (the ones `apps/e2e/tests/follow-up.spec.ts` uploads) on a throwaway account.

## Setup for recordings

### Run the app locally against mediwise-dev

1. Copy the two env files from the main checkout. Never open them.

   ```bash
   cp ~/Work/mediwise/apps/api/.env apps/api/.env
   cp ~/Work/mediwise/apps/web/.env apps/web/.env
   ```

2. Install and build the workspace packages once. On 2026-10-14 the web app in a new worktree failed to resolve `@mediwise/shared` until the packages were built.

   ```bash
   pnpm install
   pnpm --filter "./packages/*" build
   ```

3. Start the API with the report reader on. The root `pnpm dev` drops `RUN_WORKER`, so start the API on its own. Add `ASSISTANT_ENABLED=true` for features 39 and 40 only, and `ADMIN_USER_ID=<demo user id>` for feature 38 only.

   ```bash
   RUN_WORKER=true pnpm --filter @mediwise/api dev
   ```

4. Start the web app on port 5173. Add `VITE_PAYMENTS_ENABLED=true` only if a session records the credit packs (see feature 35).

   ```bash
   pnpm --filter @mediwise/web dev
   ```

5. For the landing page (feature 1), start it on port 3000. Its sign-in links go to `http://localhost:5173`.

   ```bash
   pnpm --filter @mediwise/landing dev
   ```

6. For the install banner and the offline screen (features 8 and 9), use a production build. The dev server keeps no app shell.

   ```bash
   pnpm --filter @mediwise/web build
   pnpm --filter @mediwise/web preview --port 5173 --strictPort
   ```

With 8 GB of RAM, do not run `pnpm check` while the servers run. Uploads call Claude with the key in `apps/api/.env`: at most about 6 cents for one report, less for a photo. Never run `supabase stop`.

### Sign in off camera

No password and no login form appear on camera. A script makes a sign-in link with the service role key, trades it for a session and writes a Playwright storageState file. It prints no key and no token. This is the method of the MEDI-87 screenshots (`docs/DESIGN.md`, Screens refresh). `docs/tickets/NOTES.md` has no MEDI-53 entry. The script was tested on 2026-10-14: the file opened Home signed in as the demo account.

Save the script outside the repo, for example as `~/.cache/record-flow/sign-in-state.mjs`:

```js
import { writeFile } from "node:fs/promises";

const [email, out] = process.argv.slice(2);
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: key, "content-type": "application/json" };

const link = await fetch(`${url}/auth/v1/admin/generate_link`, {
  method: "POST",
  headers: { ...headers, authorization: `Bearer ${key}` },
  body: JSON.stringify({ type: "magiclink", email }),
}).then((r) => r.json());
const session = await fetch(`${url}/auth/v1/verify`, {
  method: "POST",
  headers,
  body: JSON.stringify({ type: "magiclink", token_hash: link.hashed_token }),
}).then((r) => r.json());
if (!session.access_token) throw new Error("sign-in failed");

const ref = new URL(url).hostname.split(".")[0];
const state = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:5173",
      localStorage: [{ name: `sb-${ref}-auth-token`, value: JSON.stringify(session) }],
    },
  ],
};
await writeFile(out, JSON.stringify(state), { mode: 0o600 });
console.log(`wrote ${out} for user ${session.user.id}`);
```

Run it from the repo root, then pass the file to the recorder:

```bash
node --env-file=apps/api/.env ~/.cache/record-flow/sign-in-state.mjs arjun.demo@example.com "$JOB/demo-state.json"
RECORD_STORAGE_STATE="$JOB/demo-state.json" RECORD_APP_URL=http://localhost:5173 OUT_DIR="$JOB/video" node "$JOB/recorder.js"
```

- The file holds a live session. Keep it in the job folder, never in the repo, and delete it after the recording.
- The printed user id is the value for `ADMIN_USER_ID` in feature 38.
- To show Meera Mehta, select her in the profile switcher on camera, or preset `activeProfileId` in localStorage with `PRESETS`.

### The throwaway account

Flows that add, change or delete data run on a throwaway account, so the demo account stays as it is.

1. Record feature 2 with a new address in the form `<purpose>.demo@theyashgupta.me`, for example `onboarding.demo@theyashgupta.me`. Use a new local part for each take. Do not use `example.com`: Supabase checks the MX record of the domain, and `example.com` has a null MX, so sign-up fails with `email_address_invalid`. Sign-up sends one confirmation email. It goes to the maintainer's iCloud or it bounces. Supabase limits auth emails per hour. If sign-up shows "We sent too many emails", wait one hour. Make this account once.
2. Off camera, run the sign-in script with that address. The sign-in link also confirms the email, so no inbox is needed.
3. Give the account credits for the uploads: `pnpm --filter @mediwise/api credits:grant onboarding.demo@theyashgupta.me 8 demo`. The throwaway flows need up to 7 reads: two takes each of features 5 and 10, two study uploads in feature 27 and one optional upload in feature 25.
4. One account can add 5 reports in one day. Spread the uploads over two days, or use a second throwaway account for the phone takes.
5. Feature 37 deletes the account at the end.

### Flags

| Flag | Where | Default on dev | Set it for |
| - | - | - | - |
| `RUN_WORKER=true` | API shell | off | Every upload (features 5, 10, 27). Without it a report stays "Queued". |
| `ASSISTANT_ENABLED=true` | API shell | off | Features 39 and 40. The web reads it from `GET /me`, so the web needs no flag. Keep `ASSISTANT_REVIEW` off, or the Ask page first asks for review consent. |
| `ADMIN_USER_ID=<demo user id>` | API shell | not set | Feature 38. On the local API only. |
| `VITE_PAYMENTS_ENABLED=true` | web shell | off | Only to show the credit packs (feature 35). The API then needs `PAYMENTS_ENABLED=true`, `CASHFREE_STUB=true` and made-up `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY`. |

### What cannot be shown on dev

| Feature | Why | What to record instead |
| - | - | - |
| The Google account screens | Google blocks sign-in in a headless browser, and the screens would show a real Google account. | The button and the "Opening Google" state (feature 3). |
| Auth emails | Dev sends real email through Resend. A recording cannot open an inbox. | The page that says the email was sent, then the page that the link opens, through a service role link. |
| Paying for credits | Payments are off on dev and in production. The Cashfree checkout needs sandbox keys, and the credits come from a signed webhook. | The credit page with payments off (feature 35). |
| Sharing a file from another app into MediWise | It needs the installed app on an Android phone. | Nothing. Mention it in the upload video only if asked. |
| The print window and the saved PDF | The print window belongs to the browser, not the page. A headless recorder does not show it. | The export page and the "Download PDF" button (feature 29). |
| The install banner on desktop | It shows only when Chromium fires its install event. The built app is installable in headless Chromium, but the event is not proven there. | The iPhone hint on the phone take. Check the desktop banner in a dry run first (feature 8). |
| A downloaded file opening in another app | The calendar file, the CSV file and the data file leave the browser. | The button and the saved file name. |
| A failed read | No demo file fails on purpose. | The credit page sentence about refunds (feature 35). |

## Caption rules

These come from the `record-flow` skill.

- The first caption says who can do what, and why it matters.
- Each later caption is at most 20 words about what the viewer sees, not about mechanics.
- The last caption states the outcome.
- 4 to 8 captions per video. No names, emails, ids or amounts.
- The phone take of a **Both** feature shows the captions beside the phone, and the renderer warns above 14 words. So every caption of a **Both** feature here has 14 words or fewer.
- Write for the ear: no symbols and no abbreviations the narrator reads oddly.

## Features

Each entry URL is on the local web app, `http://localhost:5173`, unless it says otherwise. `<report id>` means the id in the address bar after you open that report from `/reports`.

### Onboarding

#### 1. Landing page

**Slug:** `landing-page`

**What it is.** The public page that explains MediWise before anyone signs up. It is for a person who has a lab report and wants to know what the numbers mean. It shows the promise, the three steps (upload, understand, track), the prices and the questions people ask. A Hindi page has the same content. It matters because it is the first thing a family member sees.

**Entry point.** `http://localhost:3000/`, then `http://localhost:3000/hi`.

**Demo data.** None. The landing page has no account. The prices come from the code.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can read what MediWise does before they sign up, in English or in Hindi.
2. The first screen says what you get: every marker explained and scored for you.
3. Three steps show the path: upload a report, understand it, then track each marker.
4. The prices sit on the page, so nothing comes as a surprise later.
5. The language switch opens the same page in Hindi.
6. One button from any section starts with your first report.

#### 2. Create an account with email

**Slug:** `sign-up-email`

**What it is.** A new person makes an account with an email and a password. MediWise sends a link to confirm the email. It matters because the account keeps every report private to the person who uploaded it.

**Entry point.** `/signup`.

**Demo data.** The throwaway account address, for example `onboarding.demo@theyashgupta.me`. Record once only, because each try sends an email. Signed out.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can create a MediWise account with an email address and a password.
2. The form asks only for an email and a password of eight characters or more.
3. Google sign-in sits above the form for people who prefer it.
4. After sign-up, MediWise sends a link to confirm the email address.
5. One click on that link, and the account is ready for a first report.

#### 3. Sign in with Google

**Slug:** `google-sign-in`

**What it is.** A person signs in with a Google account and needs no new password. The button is on the sign in page and on the create account page. Settings shows if the account is linked to Google. It matters because many people in a family already use Google on their phone.

**Entry point.** `/login`, then `/settings` (Security).

**Demo data.** Signed out for the first part. The demo account for Settings, where Security shows "Your account is not linked to Google." Record the click on "Continue with Google" and the "Opening Google" state, then stop. The Google screens cannot be recorded (see Setup).

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone with a Google account can sign in with one click, and no new password.
2. The same button sits on the sign in page and on the create account page.
3. One click hands over to Google to choose the account.
4. In Settings, the security section shows whether the account uses Google.
5. Google sign-in skips the password and opens Home.

#### 4. Sign in and reset a password

**Slug:** `sign-in-and-reset`

**What it is.** A person with an account signs in with an email and a password. A wrong password gets a plain message. A person who forgot the password asks for a reset link and sets a new password. It matters because people forget passwords between yearly check-ups.

**Entry point.** `/login`, `/forgot-password`, then the reset link, which opens `/reset-password`.

**Demo data.** Show the sign in form and the wrong password message ("The email or the password is not correct.") with the demo address. Do the reset on the throwaway account only: "Send reset link" sends one email to it, which bounces. The email cannot be shown, so sign the throwaway account in off camera with the script, then open `/reset-password`. That page accepts any signed-in session and shows "Set a new password". Never save a new password on the demo account.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone with an account can sign in, and reset a forgotten password by email.
2. A wrong password gets a plain message, with no error code.
3. Forgot your password opens a page that sends a reset link.
4. The link from the email opens a page to set a new password.
5. Type it twice, and save.
6. MediWise confirms the change, and the new password works at once.

#### 5. First upload, with the date of birth from the report

**Slug:** `upload-first-report`

**What it is.** A new person uploads a first report from the empty Home page. MediWise reads every marker and opens the report. When the profile has no date of birth, MediWise calculates one from the age printed on the report and marks it "Approximate". It matters because the first report must work before a person fills in any form.

**Entry point.** `/` (Home shows "Upload your first report"), then `/reports/upload`.

**Demo data.** The throwaway account, signed in through the script, with credits granted. File: `apps/api/fixtures/golden/sample-2024.pdf`. It prints age 30 years, so the date of birth comes out approximate. The API needs `RUN_WORKER=true`. The read takes about a minute; the renderer shortens the wait.

**Viewport.** Both. Desktop 1920 x 1080 and phone 390 x 844. A profile skips a file it already has, so delete the report between the two takes, or record the second take on a second throwaway account.

**Narration script.**

1. Anyone new can upload a first report and see every marker explained.
2. Home starts empty, with one next step: upload a report.
3. Pick the report file. The page shows who the report is for.
4. MediWise reads the report. The page updates when it is ready.
5. The report opens with a score, a verdict and every marker.
6. The first report is ready, and the profile has an approximate birth date.

#### 6. Complete the profile

**Slug:** `complete-profile`

**What it is.** After the first report, Home asks the person to complete the profile, because it has no sex yet. On the Profiles page the date of birth is already filled from the report and marked "Approximate", with a note to enter the exact date. The person enters the exact date, a sex and an ancestry, and saves. It matters because many ranges change with age, sex and ancestry, so a complete profile gives a correct score.

**Entry point.** `/`, then "Complete profile", which opens `/profiles`.

**Demo data.** The throwaway account right after feature 5. The self profile is named after the email until you change it: type a made-up name such as Arjun Mehta, choose Male and South Asian. A save confirms the date, so the Home prompt "Enter the date" does not show in this flow (see the note at the end of this section).

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. A new user finishes the profile, so each marker is scored against the right ranges.
2. Home asks to complete the profile, with a date of birth and a sex.
3. The date of birth is already filled from the age printed on the report.
4. MediWise marks it approximate, and asks for the exact date.
5. Enter the exact date, then choose a sex and an ancestry.
6. The profile is complete, so every score uses the ranges for this person.

Note. Home also has a prompt to check an approximate date of birth. It shows only for a profile that has a sex and an approximate date. The profile form needs a date of birth before it saves a sex, and a save clears the approximate mark, so a new account cannot reach that prompt through the app.

#### 7. Find your way around

**Slug:** `app-navigation`

**What it is.** The frame around every page. A sidebar holds Home, Reports, Trends, Profiles and Settings. The profile switcher at the bottom picks whose reports you see. The sidebar folds down to icons. "Keyboard shortcuts" lists the keys, for example G then R for Reports. On a phone the same places sit in a tab bar. It matters because a family member must find any page without help.

**Entry point.** `/`.

**Demo data.** The demo account. Switch between Arjun Mehta and Meera Mehta. Press `?` for the shortcuts dialog and `[` to fold the sidebar.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone signed in can move around MediWise from one sidebar, or with the keyboard.
2. The sidebar holds five places: Home, Reports, Trends, Profiles and Settings.
3. The profile switcher at the bottom picks whose reports you see.
4. The sidebar folds down to icons to give the page more room.
5. The question mark key shows every keyboard shortcut.
6. Every page is one click or two keys away.

#### 8. Install MediWise on the home screen

**Slug:** `install-app`

**What it is.** From the second visit, Home offers to install MediWise. On Android and desktop Chrome a banner says "Install MediWise". On an iPhone a sheet shows the three Safari steps under "Add MediWise to your home screen". The installed app opens full screen, like any other app. It matters because a person who opens MediWise from the home screen comes back for the next report.

**Entry point.** `/` on the production build (see Setup, step 6).

**Demo data.** The demo account. Preset `visits` to `2` in localStorage with `PRESETS`. For the phone take, also set an iPhone Safari user agent in the recorder context, so the iPhone sheet shows. The desktop banner needs Chromium's install event, so record on the production build (Setup, step 6). `apps/e2e/tests/offline.spec.ts` shows that headless Chromium finds that build installable. Check the banner in a dry run. If it does not show, record the phone take only and say so in the ticket.

**Viewport.** Both. Desktop 1920 x 1080 and phone 390 x 844.

**Narration script.**

1. Anyone can add MediWise to the home screen, so it opens like an app.
2. From the second visit, Home offers to install MediWise.
3. On an iPhone, a short sheet shows the three Safari steps.
4. The offer closes with one tap, and does not come back every day.
5. Once installed, MediWise opens full screen from the home screen.

#### 9. Offline screen and app update

**Slug:** `offline-and-update`

**What it is.** When the internet drops, MediWise shows "You are offline" and says that it keeps no report on the device. When a new version is ready, a small notice says "Update available" with an "Update" button. It matters because health data must not stay on a shared phone, and people should always get the newest version.

**Entry point.** `/` on the production build (see Setup, step 6).

**Demo data.** The demo account. Load Home once so the worker keeps the app shell. Then call `context.setOffline(true)` and open another page. For the update, build again while the page is open, then run `navigator.serviceWorker.getRegistration().then((r) => r.update())` off camera with `page.evaluate`.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone using MediWise sees a clear screen when the internet drops, and gets updates safely.
2. With no connection, MediWise says so, and keeps no report on the device.
3. When the connection comes back, the reports come back too.
4. When a new version is ready, a small notice offers to update.
5. One click reloads MediWise on the new version, with no health data left in the browser.

### The report pipeline

#### 10. Upload many files, with photo checks

**Slug:** `upload-report`

**What it is.** One report can hold up to 20 files: PDFs and photos in any mix, 25 MB each and 100 MB in total. Each file shows its own progress and a remove button. A photo that is small, dark or blurred gets a warning before it is sent. Tips for good photos sit under the drop zone. It matters because real reports arrive as a PDF from one lab and phone photos from another.

**Entry point.** `/reports/upload`.

**Demo data.** The throwaway account, after feature 6. Files: `apps/api/fixtures/golden/sample-2025.pdf` plus two photos made off camera, outside the repo. No photo fixture exists, so make them from a golden page:

```bash
pdftoppm -jpeg -r 150 -f 1 -l 1 apps/api/fixtures/golden/sample-2025.pdf "$JOB/page"
ffmpeg -y -i "$JOB/page-1.jpg" -vf eq=brightness=-0.8 "$JOB/dark.jpg"
pdftoppm -jpeg -r 60 -f 1 -l 1 apps/api/fixtures/golden/sample-2025.pdf "$JOB/small"
```

The dark photo gets "This photo is dark. Take it again in good light." The check calls a photo dark when its mean brightness is under 64 of 255. A brightness of -0.6 gives about 94, so it gets no warning. A brightness of -0.8 gives about 45. The 60 dpi photo gets "This photo is small. Take it again closer to the page." Remove both photos before you select "Read my report", so the read stays on the PDF. Delete the report between the desktop take and the phone take, because a profile skips a file it already has.

**Viewport.** Both. Desktop 1920 x 1080 and phone 390 x 844.

**Narration script.**

1. Anyone can add a report for any family member, as a PDF or photos.
2. First, choose who the report is for.
3. Add up to twenty files. Each one shows its own progress.
4. A dark or small photo gets a warning before you send it.
5. Remove a file with one tap, then read the rest.
6. MediWise reads every file as one report, and opens it.

#### 11. The report page

**Slug:** `report-page`

**What it is.** The main product. A report opens with a score from 0 to 100 and a tier, one sentence that sums up the report, and "What your report says" in short plain sentences. "Findings" say what changed since the last report. "Move first" lists the markers to work on, in order. Then every marker sits in its body group with a status: optimal, watch or risk. It matters because a person understands the whole report in a minute, without a doctor visit.

**Entry point.** `/reports/<report id>` for `29 Mar 2025 · blood panel (109 markers), ultrasound`.

**Demo data.** The demo account, Arjun Mehta.

**Viewport.** Both. Desktop 1920 x 1080 and phone 390 x 844.

**Narration script.**

1. Anyone can open a report and see what it says in plain English.
2. The score and its tier sit at the top, with the panel size.
3. One sentence gives the verdict for the whole report.
4. What your report says explains the results in short sentences.
5. Findings show what changed since the last report.
6. Move first lists the markers to work on, in order.
7. Every marker sits in its body group, with its status.
8. The whole report reads in a minute, and every marker opens in detail.

#### 12. Markers, follow-ups, unmeasured and doctor questions

**Slug:** `report-tabs`

**What it is.** The tabs under the report summary. Markers can show "Watch and risk only". Follow-ups say what to retest, add or measure, and why. Unmeasured lists important markers the report did not have. "Questions for your doctor" gives questions to take to the next visit, with "Copy all". It matters because the person leaves with a short list of what to do and what to ask.

**Entry point.** `/reports/<report id>` for `29 Mar 2025 · blood panel (109 markers), ultrasound`, scrolled to the tabs.

**Demo data.** The demo account, Arjun Mehta.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone reading a report can filter its markers and see what to do next.
2. Watch and risk only hides the markers that look fine.
3. Follow-ups say what to retest, measure or add, and why.
4. Unmeasured lists the important markers this report did not have.
5. Questions for your doctor are ready for the next visit.
6. Copy all puts every question on the clipboard.
7. The person leaves with a short list for the doctor.

#### 13. One marker explained

**Slug:** `marker-page`

**What it is.** Every marker has its own page. "Where you sit" shows the value on a bar with the lab range and the range calibrated for this person. One sentence says what the value means. "Trajectory" shows the value across reports. Then "What it is", "Why it matters" and "What moves it", a note for South Asian people where it applies, and "Sources". It matters because nothing is unexplained, and every range has a source.

**Entry point.** `/reports/<report id>/markers/vitamin_d` for the 29 Mar 2025 report.

**Demo data.** The demo account, Arjun Mehta. Vitamin D is at risk in both reports, so the trajectory has two points.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can open one marker to learn what it is and where their value sits.
2. The bar shows the lab range and the range calibrated for this person.
3. One sentence says what this value means for you.
4. The trajectory shows the value across every report.
5. Plain words explain what it is, why it matters and what moves it.
6. Every range lists its source.
7. Every marker is explained, with its sources one click away.

#### 14. Scan and ECG reports kept with the blood values

**Slug:** `report-studies`

**What it is.** A report can hold an ultrasound, an X-ray, an ECG printout or an examination form beside the blood tests. "Studies" copies the impression, the measurements and the findings word for word from the printed report. MediWise says plainly that it does not read scan images or ECG traces. It matters because one visit often has blood tests and a scan, and both belong in one place.

**Entry point.** `/reports/<report id>` for `29 Mar 2025 · blood panel (109 markers), ultrasound`, scrolled to Studies.

**Demo data.** The demo account, Arjun Mehta. The 2025 golden sample has one ultrasound page.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone who uploads a scan report sees its words kept with the blood values.
2. Studies shows the kind of study and the impression the doctor printed.
3. Measurements and findings are copied as printed, word for word.
4. MediWise says plainly that it does not read scan images or heart traces.
5. Blood values and scan reports now sit together in one report.

#### 15. Report titles and rename

**Slug:** `rename-report`

**What it is.** MediWise names each report from its dates and contents, for example `29 Mar 2025 · blood panel (109 markers), ultrasound`, never from a lab name. "Rename" lets the person choose a title. "Use the title MediWise made" brings the first title back. It matters because a list of many visits stays easy to scan.

**Entry point.** `/reports/<report id>` for the 29 Mar 2025 report.

**Demo data.** The demo account. Give the report a made-up title, then end with "Use the title MediWise made" and "Save title", so the demo report keeps its title.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can rename a report, so a long list of visits stays easy to scan.
2. MediWise names each report from its dates and contents.
3. Rename opens the title for editing.
4. Save the new title, and every list uses it.
5. One click brings back the title MediWise made.
6. The report keeps a clear name in every list and export.

#### 16. Notes for this visit

**Slug:** `visit-notes`

**What it is.** The person writes a short note on a report, for example how they felt before the test. MediWise does not read the note. The doctor sees it on the export, under the visit dates. It matters because the doctor gets the person's own words next to the results.

**Entry point.** `/reports/<report id>` for the 29 Mar 2025 report, then "Export for doctor".

**Demo data.** The demo account. The 29 Mar 2025 report already has a made-up note. Add a sentence on camera, then remove it, so the note ends as it was.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can add a note to a visit, such as how they felt before the test.
2. Notes for this visit sit on the report page.
3. The note saves when you click outside the field. MediWise does not read it.
4. The doctor export shows the note under the visit dates.
5. The doctor sees the person's own words next to the results.

### History

#### 17. Home

**Slug:** `home-dashboard`

**What it is.** The first page after sign-in. It greets the person, shows the latest report with its score, the change since the report before and a count of optimal, watch and risk markers. Under it: the year in review card, "Your family" with every profile, "Needs attention" and "Recent reports". It matters because one page tells a person how they and their family are doing.

**Entry point.** `/`.

**Demo data.** The demo account, Arjun Mehta, then Meera Mehta through the switcher. Her Home shows the episode card for `Hormone tests`.

**Viewport.** Both. Desktop 1920 x 1080 and phone 390 x 844.

**Narration script.**

1. Anyone signed in sees the latest report and what needs attention first.
2. The latest score shows its change since the report before.
3. The status bar counts optimal, watch and risk markers.
4. Year in review sums up the last year in one line.
5. Your family shows every profile and how recent their reports are.
6. Needs attention lists the markers to look at first.
7. Home gives the state of every profile at a glance.

#### 18. Family profiles

**Slug:** `family-profiles`

**What it is.** One account keeps reports for a partner, parents and children, each in their own profile. "Add family member" asks for a name, a relation, a date of birth, a sex and an ancestry. The person ticks that they have the family member's permission, and for a child also that they are the parent or guardian. It matters because each person's reports and trends stay separate, and the ranges fit each person.

**Entry point.** `/profiles`.

**Demo data.** The demo account. Add a made-up child, for example Kabir Mehta, born in 2015. Feature 19 uses this profile, so keep it until feature 19 is done. Then remove it.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can keep reports for a partner, parents or children, each in their own profile.
2. A new profile asks for a name, a relation, a birth date, a sex and an ancestry.
3. MediWise asks you to confirm that you have their permission.
4. For a child, you also confirm that you are the parent or guardian.
5. The new person now shows in the profile switcher.
6. Each person keeps their own reports, trends and ranges.

#### 19. Confirm your family profiles

**Slug:** `consent-follow-up`

**What it is.** When a family profile has no recorded permission, or a child has no recorded guardian, Home shows "Confirm your family profiles". It names each person and what to confirm. "Confirm" records the date. If the person has no permission, the prompt points to the Profiles page to remove the profile. It matters because MediWise keeps a dated record that the account holder may keep each person's reports.

**Entry point.** `/`.

**Demo data.** Missing on dev: every demo profile is confirmed. Off camera, clear the dates of the child added in feature 18 in the SQL editor of `mediwise-dev`: set `permission_confirmed_at` and `guardian_confirmed_at` to null on that one row of `profiles`. Then the prompt shows both lines. Remove the child after the recording.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. An account holder confirms they may keep each family member's reports.
2. Home shows a prompt when a confirmation is missing.
3. It names each person, and says what to confirm.
4. Without permission, the person removes the profile on the Profiles page.
5. Confirm records the date of each confirmation.
6. The prompt goes away, and the account has a dated record.

#### 20. Due for retest

**Slug:** `retest-reminders`

**What it is.** For a few markers with a sourced retest interval (HbA1c, eGFR and urine ACR at watch or risk), Home shows "Due for retest" with a due date. "Add to calendar" saves a calendar file for the phone. The list says "Ask your doctor before you book a retest." MediWise stores no reminder. It matters because a person does not forget the next test.

**Entry point.** `/`.

**Demo data.** Missing on dev: no demo report has one of these markers at watch or risk, so the list does not show. Two ways: (a) a new made-up lab fixture with HbA1c at watch, for example 6.0 %, dated more than a year ago, uploaded to a throwaway profile; (b) the MEDI-54 screenshot method, which added two rows to the `GET /dashboard` response in the browser (`page.route` in the recorder). Option (a) shows real data. Ask the maintainer to choose before the recording ticket starts.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can see which markers are due for a retest, with a date from a sourced interval.
2. Due for retest lists each marker with its due date.
3. A date in the past says since when the retest is due.
4. Add to calendar saves a file for the phone calendar.
5. MediWise asks you to check with your doctor before you book.
6. The retest date sits in the person's own calendar, and MediWise stores no reminder.

#### 21. Reports list

**Slug:** `reports-list`

**What it is.** Every report of one profile, newest first. Each row shows the title, the date, the score ring with its tier and the status. The profile switcher changes whose reports are listed. It matters because a person finds any past visit in one place.

**Entry point.** `/reports`.

**Demo data.** The demo account. Arjun Mehta has two reports, Meera Mehta has five.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can see every report of one profile, newest first.
2. Each row shows the title, the date, the score and the status.
3. The profile switcher changes whose reports are listed.
4. Any past visit opens in one click.

#### 22. Trends

**Slug:** `trends`

**What it is.** How each marker changes from one report to the next. Each row shows a small line, the latest value, the last change and the status. "Filter by category" narrows the list to one body system. Sort by "Biggest change" puts the largest moves on top. "Compare reports" opens the comparison. It matters because the direction of a value often matters more than one result.

**Entry point.** `/trends`.

**Demo data.** The demo account, Arjun Mehta (two reports with 109 markers each).

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone with two reports or more can see how each marker changes over time.
2. Each row shows the trend line, the latest value and the last change.
3. A category filter narrows the list to one body system.
4. Sorting by biggest change puts the largest moves on top.
5. Every marker opens its own trend.

#### 23. One marker over time

**Slug:** `trend-detail`

**What it is.** One marker on one chart, with every value it has had. The band shows the optimal range for the profile. Each dot has its status colour. "Last 90 days" and "All reports" change the time range. When results come from different labs, a note says that ranges can differ by lab. It matters because one chart tells the story of a marker across years.

**Entry point.** `/trends/ldl_cholesterol`.

**Demo data.** The demo account, Arjun Mehta. LDL is at watch in both reports and rose between them. Both reports come from one lab, so the lab note does not show.

The range buttons show only when three values or more fall in the last 90 days. No demo marker has that, so the video does not show them.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can open one marker and see every value it has had, on one chart.
2. The band shows the optimal range for this profile.
3. Each dot has the colour of its status.
4. One chart tells the story of one marker across the years.

#### 24. Compare two reports

**Slug:** `compare-reports`

**What it is.** Two reports of one profile side by side. The page opens with the latest two. "Report A" and "Report B" pick any other pair. A summary counts what improved, worsened, stayed the same, is new or was not retested. "Changed only" hides the markers that did not move. It matters because a person sees what changed between two visits on one screen.

**Entry point.** `/compare`, or "Compare reports" on Trends or on a report.

**Demo data.** The demo account, Arjun Mehta (9 Mar 2024 and 29 Mar 2025).

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can put two reports side by side to see what changed.
2. The page opens with the latest two reports, and either side can change.
3. The summary counts what improved, worsened, stayed the same or is new.
4. Changed only hides the markers that did not move.
5. The differences between two visits fit on one screen.

#### 25. Episodes

**Slug:** `episodes`

**What it is.** An episode groups the reports of one set of tests, for example many tests in a few weeks. MediWise suggests one when three reports arrive within 45 days ("These reports may belong together"). The episode page shows a timeline, "Repeated markers", the first and last value of each, the studies and "Measured once". The person can end the episode or open it again. It matters because a month of tests for one problem reads as one story.

**Entry point.** `/profiles` with Meera Mehta active (Episodes section), then the episode page `/episodes/<episode id>`.

**Demo data.** The demo account, Meera Mehta, episode `Hormone tests`. The episode is already saved, so the suggestion does not show. To show a suggestion, use the throwaway account after feature 27 and upload `apps/api/fixtures/golden/sample-2025.pdf` to the same profile: three reports in 45 days, as in `apps/e2e/tests/follow-up.spec.ts`. On the demo account, if you press "End the episode", press "Open the episode again" before you stop.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone with many tests in a few weeks can group them as one episode.
2. MediWise suggests an episode when three reports arrive close together.
3. The timeline shows every report of the episode in date order.
4. Repeated markers show each value measured more than once.
5. Measured once lists results to talk about with a doctor.
6. A month of tests now reads as one story.

#### 26. Year in review

**Slug:** `year-in-review`

**What it is.** A page that sums up the last year of one profile. Three tiles give the score, the number of reports and the labs. "Markers that moved" and "Markers still at risk" each get a list, then the markers measured once. It opens from a card on Home and from the profile card. "Print" gives a clean page. It matters because a yearly check-up is easier to discuss with the whole year on one page.

**Entry point.** `/` then "Open the review", which opens `/year-review`.

**Demo data.** The demo account, Arjun Mehta (9 Mar 2024 to 29 Mar 2025). No marker changed status in this pair, so "Markers that moved" shows its empty line. The intro is written by Claude on the first open and is kept, so a second open costs nothing.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone with two reports in a year can see what changed over that year.
2. Home shows a year in review card under the latest report.
3. Three tiles give the score, the number of reports and the labs.
4. Markers that moved and markers still at risk each get their own list.
5. Markers measured once have no trend yet, so they get their own list.
6. One page sums up the year, ready to print for a doctor.

#### 27. Report links and auto-link of a repeat study

**Slug:** `auto-link-repeat`

**What it is.** When a later report has the same kind of study of the same body region within 90 days, MediWise links the two reports as a repeat by itself. Both report pages show a one-line notice ("MediWise linked these reports because both have the same study within 90 days.") with "Undo". "Linked reports" lists the link on both reports. It matters because the person does not fill a form for the common case.

**Entry point.** `/reports/upload`, then the two report pages.

**Demo data.** The throwaway account. Add a made-up female family member born on 1983-05-10, then upload `apps/api/fixtures/studies/usg-pelvis-2025-03-18.pdf` and `apps/api/fixtures/studies/usg-pelvis-2025-03-22.pdf` to her, as in `apps/e2e/tests/follow-up.spec.ts`. Uses two credits. Never press "Undo" on the demo account: Undo dismisses the link for good.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone who repeats a scan sees MediWise link the two reports, with no form to fill.
2. The first ultrasound shows its alert at the top of the report.
3. A repeat of the same study within ninety days gets linked by itself.
4. A one-line notice on both reports explains the link.
5. Undo removes the link if MediWise got it wrong.
6. Repeat studies stay connected, with no extra work.

#### 28. Second opinions and settled alerts

**Slug:** `second-opinion-settled`

**What it is.** A later report can answer an alert from an earlier report. When the repeat study prints a normal result, the alert leaves Findings and the headline, and moves to "Settled". Settled shows both printed lines, the date of each study and the lab. "Link reports" adds a repeat or a "Second opinion" by hand when MediWise did not find the pair. It matters because the report history then reads the way the doctor explained it.

**Entry point.** `/reports/<report id>` for Meera Mehta's `10 Feb 2025 · ultrasound`, then her `17 Mar 2025 · ultrasound`.

**Demo data.** The demo account, Meera Mehta. The cyst on 10 Feb 2025 is settled by the repeat on 17 Mar 2025. Open the "Link reports" form to show it, then close it without saving.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone whose later report answers an earlier alert sees that alert marked settled.
2. Linked reports shows the repeat, with the name of the other report.
3. The earlier alert has left the findings and the headline.
4. Settled shows both printed lines, with the date of each study.
5. Link reports adds a repeat or a second opinion by hand.
6. The report now shows the question as answered, in the lab's own words.

### Export and sharing

#### 29. Doctor export as PDF

**Slug:** `doctor-export`

**What it is.** A black on white summary of one report for a doctor. It has the profile, the visit dates and the visit note, "Move first", patterns, findings, repeat studies, "Questions for the doctor" and every marker with the lab range and the calibrated range. A "Previous" column shows the value from the report before. "Print" and "Download PDF" open the print window. It matters because the doctor reads one clear summary in minutes.

**Entry point.** `/reports/<report id>` for the 29 Mar 2025 report, then "Export for doctor" (`/reports/<report id>/export`).

**Demo data.** The demo account, Arjun Mehta. The 9 Mar 2024 report fills the Previous column. The print window cannot be recorded (see Setup), so stop on the button.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can give their doctor a clean summary of one report, on paper or as a file.
2. Export for doctor opens a black and white page.
3. Every marker shows the lab range and the calibrated range.
4. A previous column shows the value from the report before.
5. Questions for the doctor and the visit note are on the page too.
6. Download PDF opens the print window to save the file.
7. The doctor gets a summary they can read in minutes.

#### 30. Share a report with a link

**Slug:** `share-with-doctor`

**What it is.** "Share with your doctor" makes a link that opens the report summary with no account. The person can copy it or "Send on WhatsApp". Each link ends on a set date. "Shared links" lists every link with how often it was opened, and "End link" stops it at once. It matters because a doctor in another city sees the report from a phone.

**Entry point.** `/reports/<report id>` for the 29 Mar 2025 report, then "Share with your doctor".

**Demo data.** The demo account. Make one link, copy it for feature 31, and end it with "End link" after feature 31. Hover over "Send on WhatsApp" but do not open it, because it leaves the local app.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can send a report to a doctor as a link, with no account needed to open it.
2. MediWise makes the link and says who can see it.
3. Copy the link, or send it on WhatsApp.
4. Each link ends on a set date.
5. Shared links lists every link, with when it was last opened.
6. End link stops a link at once.
7. The report reaches the doctor, and the person keeps control of the link.

#### 31. What the doctor sees from a link

**Slug:** `open-shared-link`

**What it is.** The page a doctor opens from a shared link: the same summary as the doctor export, with no sign-in. After the link ends, the page says "This link has ended" and asks for a new link. It matters because the doctor needs nothing but the link.

**Entry point.** `/share/<token>` from feature 30.

**Demo data.** The link from feature 30, opened in a recorder context with no storageState. End the link in feature 30, then reload this page for the last caption.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. A doctor can open a shared report with no MediWise account.
2. The page shows the same summary as the doctor export.
3. The disclaimer and the labs stay at the bottom of every page.
4. When the link ends, the page says so, and the report is no longer visible.

#### 32. Download all values and my data

**Slug:** `download-data`

**What it is.** Two downloads in Settings. "Download all values (CSV)" gives one spreadsheet file with every marker of the active profile. "Download my data" gives every profile, report and marker of the account in one file. It matters because the data belongs to the person, and they can take it anywhere.

**Entry point.** `/settings`, section "Your data".

**Demo data.** The demo account. The files are saved by the browser and are not shown in the video. Delete them after the recording.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can take a copy of their values, or of their whole account.
2. One button gives a spreadsheet file with every marker value.
3. Download my data gives every profile, report and marker in one file.
4. The data belongs to the person, and leaves with one click.

### Settings and account

#### 33. Settings

**Slug:** `settings-account`

**What it is.** One page for the account. "Identity" holds the name. "Your profile" holds the date of birth, sex and ancestry. "Report credits" shows how many reports are left. "Appearance" sets light, dark or the system theme. "Security" changes the password and shows the Google link. "Language" switches English and Hindi. It matters because a person changes anything about the account in one place.

**Entry point.** `/settings`.

**Demo data.** The demo account. Do not save a new name or password on the demo account. Show the fields, switch the theme and switch it back.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone signed in can change their name, their profile, the theme and their password.
2. Identity holds the name shown across MediWise.
3. Your profile sets age, sex and ancestry for scoring.
4. Report credits shows how many reports are left.
5. Appearance switches between light, dark and the system theme.
6. Security changes the password and shows if Google is linked.
7. Every account setting sits on one page.

#### 34. MediWise in Hindi

**Slug:** `hindi-language`

**What it is.** The whole app in Hindi: menus, buttons, messages and the report text. The first time a Hindi user opens a report, MediWise writes its text in Hindi and shows the English text with a note until then. Marker names, lab names, units and numbers stay as the lab printed them. It matters because many family members read Hindi more easily than English.

**Entry point.** `/settings`, section "Language", then `/reports/<report id>` for the 29 Mar 2025 report.

**Demo data.** The demo account. The first Hindi open of a report calls Claude once (about 0.2 cents); later opens cost nothing. The language is saved in the account, so switch it back to English at the end.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can use MediWise in Hindi, including the explanations on each report.
2. The language setting switches the whole app at once.
3. Menus, buttons and messages now appear in Hindi.
4. The report text is written in Hindi the first time it opens.
5. Marker names and values stay as the lab printed them.
6. The same report now reads in Hindi, with the same numbers.

#### 35. Report credits

**Slug:** `report-credits`

**What it is.** Each report that MediWise reads uses one credit. When MediWise cannot read a report, it returns the credit. Today the page says "You cannot buy credits yet. Payments come in a later release." and how to get credits. It matters because a person always knows how many reports are left.

**Entry point.** `/credits`, or "How to get more credits" in Settings.

**Demo data.** The demo account (4 credits on 2026-10-14). Record with payments off, which is what production shows today. The credit packs show only with the payment flags in Setup, and the payment itself cannot be shown.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can see how many reports they have left to read.
2. Each report that MediWise reads uses one credit.
3. When a report cannot be read, the credit comes back.
4. Payments come in a later release, so the page says how to get credits now.
5. The person always knows how many reports remain.

#### 36. Terms, privacy, refunds and contact

**Slug:** `policy-pages`

**What it is.** Four policy pages: "Terms of use", "Privacy policy", "Refund policy" and "Contact". The links sit in the footer of every page, signed in or not. The privacy policy explains family profiles, children and deletion records. The policy text is in English in both languages, because it needs a legal review first. It matters because a person can check how their data is handled before they upload.

**Entry point.** `/terms`, `/privacy`, `/refunds`, `/contact`.

**Demo data.** None. Signed out is fine.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can read the terms, the privacy policy, the refund policy and the contact page.
2. The links sit in the footer of every page.
3. The privacy policy explains family profiles, children and what deletion keeps.
4. Every policy is one click away, signed in or not.

#### 37. Delete the account

**Slug:** `delete-account`

**What it is.** "Delete account" in Settings deletes every profile, report and uploaded file. The dialog suggests a download first. The person types a word to confirm. It matters because the person can leave at any time and take nothing with them by accident.

**Entry point.** `/settings`, section "Your data", then "Delete account".

**Demo data.** The throwaway account only, as the last flow that uses it. Never on the demo account.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can delete their account and every file in it, at any time.
2. Delete account sits under Your data in Settings.
3. The dialog says what goes, and suggests a download first.
4. Typing the word shown confirms the choice.
5. The account, every profile and every file are gone.

### The operator page

#### 38. The operator page

**Slug:** `operator-page`

**What it is.** A page for the person who runs MediWise. It shows "Claude spend" this week and this month against the monthly cap, reads and questions this month, "Reads per day", "Jobs waiting", credits granted and spent, profiles and active users, and "Failed reads" with a "Re-read" button. It shows no patient data. Only the admin account can open it; every other account gets the not found page. It matters because one page tells the operator if MediWise is healthy and what it costs.

**Entry point.** `/admin`. The link is not in the navigation.

**Demo data.** The demo account, with `ADMIN_USER_ID` set to its user id on the local API only. The page shows counts for all of `mediwise-dev`. Never press "Re-read": it uses another account's credit. Keep amounts out of the captions.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. The operator can check costs, reads and failures, with no patient data on the page.
2. Claude spend shows this week, this month and how much of the monthly cap is used.
3. Reads per day charts the last thirty days.
4. Jobs waiting shows if the reader falls behind.
5. Credits show how many were granted and spent.
6. Failed reads lists the newest failures, each with a button to read it again.
7. One page tells the operator if MediWise is healthy.

### The assistant

#### 39. Ask about your reports

**Slug:** `ask-about-reports`

**What it is.** A person asks a question about one profile's reports and gets 1 to 5 short sentences. "Each answer names the report and the date of every number." A cited chip opens the value on a fact card ("Cited value"). "Answers come only from your reports." The assistant explains. It does not diagnose, treat or reassure, and answers are in English. It matters because a person can ask how a value changed without reading every report.

**Entry point.** `/` ("Ask about your reports" card under the latest report), then `/ask`.

**Demo data.** The demo account, Arjun Mehta. The API needs `ASSISTANT_ENABLED=true` (off on dev). Each answer calls Claude (a fraction of a cent). Each report read gives 5 questions.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone can ask about one profile's reports, and get a short answer with its sources.
2. The ask card sits on Home, under the latest report.
3. Suggested questions start from your own findings.
4. Each answer names the report and the date of every number.
5. Select a cited value to see it on the fact card.
6. The person gets a sourced answer in seconds, never a diagnosis.

#### 40. Questions left, wrong answers and clear chat

**Slug:** `ask-chat-controls`

**What it is.** "Ask about this report" opens the chat from a report page. A counter shows the questions left. "This answer is wrong" flags an answer for the team to check. "Clear chat" deletes every question and answer of the profile. It matters because the person stays in control of the chat and can report a bad answer.

**Entry point.** `/reports/<report id>` for the 29 Mar 2025 report, then "Ask about this report" (`/ask?report=<report id>`).

**Demo data.** The demo account, with `ASSISTANT_ENABLED=true`. Ask one question first, so there is an answer to flag. Clearing the chat deletes the demo chat, which is fine.

**Viewport.** Desktop 1920 x 1080.

**Narration script.**

1. Anyone asking questions can see how many are left, and keep the chat tidy.
2. Ask about this report opens the chat from a report page.
3. The counter shows how many questions are left.
4. This answer is wrong flags an answer for the team to check.
5. Clear chat deletes every question and answer for this profile.
6. The chat stays short, and every wrong answer gets a second look.
