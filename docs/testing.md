# Testing

MediWise has these test layers. CI runs each of them on every push and every pull request.

| Layer | Command | What it covers |
| --- | --- | --- |
| Unit | `pnpm check` | Typecheck, lint and Vitest in every package, with rendered page tests for the web. The rules are in [.claude/rules/testing.md](../.claude/rules/testing.md). |
| Coverage | `pnpm coverage` | The unit tests again with V8 coverage. It prints a summary per package and fails below the package threshold. |
| Database | `pnpm test:db` | The SQL in `apps/api` against a real Postgres: credits ledger, purchases, question packs and questions left, the Claude spend cap with assistant questions, and the history queries (earlier values, same-day order, trends, compare, retests). |
| End-to-end | `pnpm e2e` | The main flow in a real browser, against a local Supabase and the real API and web. |
| Bundle size | `pnpm size` | The gzip size of each web chunk and of the landing first load, against a committed baseline. |
| Performance | `pnpm perf` | Lighthouse budgets and INP on production builds, with the dense history fixture. |
| Supply chain | CI only | Tripwires for a trojanized dependency, in `.github/workflows/supply-chain-scan.yml`. It runs on a push to `main`, on each pull request and every day at 03:30 UTC. |

## Timeouts and workers

Every Vitest project uses the default timeout of 5 s. A test that needs more declares its own timeout, with a one-line reason above it.

- Declare the timeout on the test: `test("...", async () => { ... }, 15_000)`. When every test in a file renders the whole app, put `vi.setConfig({ testTimeout: 15_000 })` under the imports.
- Give the reason as the work the test does on purpose and the time it takes alone and on a loaded machine, for example "Loads the real ESLint config and its plugins, about 1.5 s alone and over 20 s on a loaded 8 GB Mac".
- Do not raise a timeout to hide a cost that is not necessary. Remove the cost: fake timers for a poll or a delay (`vi.useFakeTimers({ shouldAdvanceTime: true })` and `vi.advanceTimersByTimeAsync`), one fixture for a file in place of one for each test, a container render in place of the whole app.
- Do not set `testTimeout` in a Vitest config.

These tests declare a timeout today:

| Test | Timeout | Reason |
| --- | --- | --- |
| The 11 web page test files that render the whole app (`vi.setConfig`) | 15 s | The first test loads its route. Up to 9 s on a loaded Mac with 7 workers. |
| `assistant.context.test.ts`, over the cap | 15 s | Builds 7,200 values over the token cap. 6.8 s seen on a loaded Mac. |
| `eslint.config.test.js` in api and web, `eslint.test.js` in config | 30 s | Loads the real ESLint config and its plugins. 23 s seen on a loaded Mac. |

The web and api packages run at most 3 Vitest workers on a laptop. Without a cap, Vitest starts one worker for each core but one, so two `pnpm check` runs at once on an 8 GB Mac start up to 28 workers on 8 cores. Then the slowest page test took 7.7 s to 9.2 s, and with 3 workers it took 2.8 s to 3.4 s (MEDI-98). In CI, where `CI` is set, Vitest uses its default.

## Rendered page tests

A web page test renders the whole app in jsdom with Testing Library. It uses the helper in `apps/web/src/test/render-app.tsx`.

- Put `/** @vitest-environment jsdom */` on the first line of the test file.
- `fakeNetwork({ "GET /me": () => body })` replaces `fetch`. It answers the API and Supabase, and records each request. A request with no handler fails like a dropped connection. Use `problem(status, title)` for an error and `never` for a request that stays pending.
- `renderApp(path, { locale })` stores a session and renders the app router at the path. `renderInApp(ui)` renders a container that has no route.
- Call `afterEach(resetApp)`.
- Assert on roles and on text from `config/messages`, in English and in Hindi. Do not mock a component or a hook of the app.
- The payments flag is read when the payments module loads. A test file sets it with `vi.stubEnv` before it imports the helper. See `modules/payments/containers/buy-credits-container.test.tsx`.
- Cashfree is a script, not a `fetch` call. jsdom does not load scripts, so the checkout test answers the script tag with a fake `window.Cashfree`.

## Coverage

`pnpm coverage` runs the `coverage` script of each package that has unit tests: api, web, landing, engine, shared and design-tokens. The CI `e2e` job runs it after `supabase start`, so the job log shows the four numbers (statements, branches, functions, lines) of each package.

- The api coverage runs the unit project and the db project together (`apps/api/vitest.coverage.config.ts`) and counts both. The repos and the encryption code run their SQL only in the db project. Start the local Supabase before you run it on your machine.

- Coverage counts every `.ts` and `.tsx` file under `src`, also a file that no test loads. Test files are not counted.
- Each package sets four thresholds in its `coverage` script, never lower than measured minus 10, revisited when a ticket adds tests. A change that drops a package below a threshold fails the job.
- When coverage goes up, raise the thresholds in the same pull request. Never lower a threshold to make a change pass.
- `packages/config` has no `coverage` script. Its test checks the ESLint config, which has no code to count.

## Database tests

A file that ends in `.db.test.ts` runs only in the db project (`apps/api/vitest.db.config.ts`). `pnpm check` never runs it.

- The project uses the local Supabase of the e2e suite. Before each run it drops and creates the database `mediwise_test` and applies every Drizzle migration. The e2e data in the `postgres` database is not touched.
- It runs with `CLAUDE_STUB=true`, an empty `ANTHROPIC_API_KEY` and `CLAUDE_MONTHLY_CAP_CENTS=100`. It never calls Claude or Supabase auth.
- Each test makes its own user id with `randomUUID()`, so tests do not share rows.
- History tests seed the dense fixture with `insertDenseHistory` from `apps/api/src/db/dense-history.ts`, the same rows as `db:seed-history`. A test named "audit row N" covers row N of [research/continuous-history.md](research/continuous-history.md).
- In CI the db tests run inside `pnpm coverage` in the `e2e` job, after `supabase start` and before `pnpm e2e`. `pnpm test:db` runs them alone, without coverage.

### Row level security

`apps/api/src/db/rls.db.test.ts` checks that the public anon key cannot reach a table through PostgREST.

- PostgREST serves only the `postgres` database, so this file applies the migrations there too, the same as `pnpm e2e`. It writes its rows for two new users and deletes them at the end.
- It reads the table list from the `CREATE TABLE` lines in `apps/api/src/db/migrations`. A new table fails the suite until `seedRows` writes a row to it.
- For each table: the anon key, with user A's session and with no session, reads no row and updates or deletes no row of user B. The service role reads the rows of both users.
- No table has a policy. The API reads as `mediwise_app`, which bypasses RLS, so PostgREST shows no row to a user, also not the user's own rows. A new policy fails the suite until the test changes with it.
- The local keys come from `supabase status`. The test has no key in it.

`apps/api/src/modules/shares/shares.db.test.ts` checks the share link. A request with no session and an open token reads the export of the shared report only: no other report of the owner, no data of another user, no user id, report id or token hash. A wrong or ended token reads nothing.

Run it on your machine:

```sh
supabase start --workdir apps/e2e
pnpm test:db
supabase stop --workdir apps/e2e
```

### When a test belongs in the db project

Put a test in the db project when the behaviour lives in the SQL, not in TypeScript:

- A unique index or constraint, for example one purchase per payment order (migration 0014).
- A lock or a transaction that must hold under two concurrent calls, for example two webhooks for one order or two uploads for the last credit.
- An aggregate the code trusts, for example the credit balance as the sum of the ledger, or this month's Claude spend.
- An order or a date filter the code trusts, for example the newest upload of a date wins, or a report of the same date is never an earlier value.

A fake repo is enough when the test checks a route, a service decision or an error mapping, and the SQL only stores and returns rows. Keep those tests in the unit layer, they run in every `pnpm check`.

## End-to-end suite

The suite is in `apps/e2e`. It uses Playwright with Chromium only. One spec file, `apps/e2e/tests/main-flow.spec.ts`, runs these tests in order with one user:

1. Sign up with email. The local Supabase confirms the account at once. The test then gives the user one report credit with `credits:grant`.
2. Add a family member profile.
3. Upload `apps/api/fixtures/golden/sample-2025.pdf` for that profile and wait until the read is done.
4. Open the report. Check the score (89) and the vitamin D, LDL and TSH rows.
5. Open the doctor export.
6. Download the profile CSV and check the vitamin D value.
7. Sign out.

A spec file, `apps/e2e/tests/dense-history.spec.ts`, signs up another user and seeds a profile with 12 reports in 10 weeks with `db:seed-history` (no upload, no Claude call). It checks that the Home score change compares two full panels, the New since strip with the narrow reports, the stale line, that a report opened low on Home starts at the top and Back restores the Home scroll offset at 390 px, the glucose trend at 390 and 1440 px with no overlapping chart labels, the compare page with the first and last report, and the doctor export of the newest full panel in English and in Hindi. In the export, each marker row is whole in one page box, each box has the footer with the labs, and the A4 and Letter PDFs have one page for each box (MEDI-90). The audit behind it is in [research/continuous-history.md](research/continuous-history.md).

`db:seed-history` dates the newest report on the local day of the machine, the same clock the spec uses to count back, so the spec passes at any hour in any time zone (MEDI-96).

A spec file, `apps/e2e/tests/follow-up.spec.ts`, signs up another user with three credits and a female member profile. In order, it:

1. Uploads `apps/api/fixtures/studies/usg-pelvis-2025-03-18.pdf`, a pelvis ultrasound with a 4.2 cm adnexal mass, and checks the study alert finding.
2. Uploads `usg-pelvis-2025-03-22.pdf`, a repeat scan of the abdomen and pelvis with no mass. The report shows the automatic link with its notice and Undo button (MEDI-79).
3. Opens the first report. The mass is not in Findings. The Settled block shows both study dates and the lab of the second scan (MEDI-67).
4. Uploads `sample-2025.pdf`, the third visit in 11 days. The profiles page proposes an episode. The test saves it and finds it in the episode list (MEDI-68).
5. Makes a share link and opens it in a new browser context with no session. The doctor export shows the lab (MEDI-58).
6. Downloads the CSV of the active profile from Settings and checks the vitamin D value (MEDI-62).
7. Switches the language to Hindi. The report page keeps the score and the values and shows Devanagari text (MEDI-64 and MEDI-66).

A spec file, `apps/e2e/tests/admin.spec.ts`, tests the operator page `/admin` (MEDI-94). It makes the demo account `arjun.demo@example.com` with the fixed user id that `apps/e2e/local-env.ts` gives the API as `ADMIN_USER_ID`, and signs up a second user who is not the admin. In order, it:

1. Checks that `GET /admin/overview`, `GET /admin/spend` and `POST /admin/reports/:id/retry` return 401 with no session.
2. Checks that the second user gets Not Found on `/admin` with no breadcrumb and no link to `/admin`, and 404 from the three routes.
3. Seeds the dense history of the second user with `db:seed-history`, reads the 2025 sample, and marks that report failed with no credits, as the worker does. It adds a job that brings the month to 90% of the cap and a queued job from 45 minutes ago. These two jobs have the kinds `e2e_spend` and `e2e_stale`, and the spec deletes them at the end.
4. Signs in as the admin and compares every number on the page with the `GET /admin/overview` response that the page loaded: spend, reads chart, queue, credits, profiles and the failed reads with their error class.
5. Checks the spend alert line and the queue alert line.
6. Clicks Re-read on the failed report. The row goes off the failed table, the report reaches done, and the owner has one credit less.

A spec file, `apps/e2e/tests/checkout.spec.ts`, buys the 5 credit pack on the credits page with payments on. See [No Cashfree call](#no-cashfree-call).

A spec file, `apps/e2e/tests/offline.spec.ts`, runs against a production build of the web, because the dev server keeps no app shell. It signs up a user and checks that Chrome reports no installability error. It checks that Cache Storage holds only the app shell and no API response. Then it opens a new page offline, as a user opens the installed app, and checks that the service worker serves the shell with the offline state. A reload does not work for this check, because Chromium resets `navigator.onLine` to true on a reload under Playwright.

### No Claude call

The suite never calls Claude.

- The API runs with `CLAUDE_STUB=true`. Then `apps/api/src/lib/anthropic.ts` uses the stub in `apps/api/src/lib/anthropic-stub.ts`, not the Anthropic client.
- The stub answers from the golden files in `apps/api/fixtures/golden`. It makes no network call. It knows only the two made-up samples, `sample-2024.pdf` and `sample-2025.pdf`.
- The stub also reads the two made-up ultrasound reports in `apps/api/fixtures/studies`. It finds each one by the lab id the page prints, and answers the page class and the study from the JSON file next to the PDF. `sample-2025.pdf` also prints an ultrasound page, and the stub keeps it a lab page.
- The stub gives no narrative, finding text or Hindi text, so the report shows the engine text only. A Hindi report keeps the English of the text that Claude would translate.
- The suite sets `ANTHROPIC_API_KEY` to an empty value. The API reads an empty value as unset, so no key reaches the API, also when `apps/api/.env` has one.
- The API does not start when `CLAUDE_STUB=true` and `NODE_ENV=production`.

The golden score of `sample-2025.pdf` is 87 for a profile with no age and no sex. The main flow profile is a male born on 1965-04-12, so the score is 89. The follow-up profile is a female born on 1983-05-10, so the score is 88. The stub returns the printed collection date (2025-03-29), so the age and the score do not change from one year to the next.

### No Cashfree call

The suite runs with payments on and never calls Cashfree.

- The API runs with `PAYMENTS_ENABLED=true`, `CASHFREE_STUB=true` and made-up Cashfree keys. Then an order gets the payment session `session_stub_<order id>` and the API makes no Cashfree call. The API does not start when `CASHFREE_STUB=true` and `NODE_ENV=production`.
- The webhook check stays real. The test signs a copy of `apps/api/fixtures/cashfree/payment-success.json` with the made-up secret key, as Cashfree signs a webhook, and sends it to the API. Each run uses a new payment id, because the ledger credits a payment id once.
- The web runs with `VITE_PAYMENTS_ENABLED=true`. The test answers every request to `cashfree.com` with a small script in place of Cashfree's checkout script. Its checkout reports a finished payment at once. The test fails when the page asks Cashfree for anything else.

### Run it on your machine

You need Docker (Docker Desktop or Colima) and the Supabase CLI.

```sh
supabase start --workdir apps/e2e
pnpm e2e
supabase stop --workdir apps/e2e
```

- `supabase start` uses `apps/e2e/supabase/config.toml`. That file turns off the services the suite does not use and creates the private `reports` bucket. It is not in the root `supabase` folder, so `supabase config push` never reads it.
- `pnpm e2e` applies the Drizzle migrations to the local database. Then it starts the API on port 3101 and the web on port 5174, with the same commands as `pnpm dev`. It also builds the web and serves the build with `vite preview` on port 5175 for the offline spec. The API and the web get the local Supabase URL and keys, not the values in `apps/*/.env`. The API gets `ADMIN_USER_ID` set to the fixed id of the demo account, so only that account opens `/admin`.
- The dev web server always gets `NODE_ENV=development`. A shell with `NODE_ENV=production` would otherwise turn off the dev-only `/dev/kitchen-sink` page that `score-ring.spec.ts` opens.
- The suite does not use a running `pnpm dev`. That process uses `apps/api/.env`, which has the real Claude key and the dev Supabase project.
- On a machine with 8 GB of RAM, do not run `pnpm e2e` together with `pnpm check` or `pnpm dev`. Stop Supabase when you are done.
- Each run makes a new user. The local database keeps the old users until `supabase stop`.
- When a test fails, Playwright keeps a screenshot and a trace in `apps/e2e/test-results`. Open a trace with `pnpm --filter @mediwise/e2e exec playwright show-trace <path>/trace.zip`.

### Selectors

Tests find elements by `data-testid` only. Do not select by visible text, because the web text changes with translations.

- Give a new test id the form `<area>-<thing>`, for example `report-export-link` or `profile-sex`.
- A list item adds its key: `marker-row-<markerKey>`, `profile-sex-<value>`.
- When you rename or remove an element that has a test id, keep the test id or change the test in the same commit.

### In CI

The `e2e` job in `.github/workflows/check.yml` runs after the `check` job.

- It installs the Supabase CLI from a cache, runs `supabase start --workdir apps/e2e`, installs Chromium and runs `pnpm e2e`.
- The job stops after 10 minutes.
- When the job fails, it uploads the Playwright report and the traces as the `playwright-report` artifact.
- The deploy workflows call `check.yml`, so a deploy waits for the `check`, `e2e` and `perf` jobs.
- The `perf` job runs in parallel with the `e2e` job. See [Performance budgets](#performance-budgets).

## Bundle size

`pnpm size` builds the landing and the web, then runs `scripts/bundle-size.mjs`. The CI `check` job runs it after `pnpm coverage`.

- It measures the gzip size of each chunk in the Vite manifest of `apps/web`, and `web first load`, the sum of the files that `index.html` loads.
- It measures `landing first load`, the scripts in `apps/landing/out/index.html` without the `nomodule` polyfill.
- A chunk has a name from its source path (a route) or its chunk name (a shared chunk), never from its hash.
- The baseline is `scripts/bundle-size.json`, in bytes.

The check fails when:

- A chunk grows more than 10% and more than 500 bytes over its baseline. The 500 bytes stop an 85 byte route chunk from failing on a renamed import.
- `landing first load` is more than 150 kB (150,000 bytes).
- A chunk is in the build and not in the baseline, or in the baseline and not in the build.

### Read a failing size check

The job log shows a table with the baseline, the new size and the change of each chunk. The lines under "Bundle size check failed" name each chunk that failed.

1. Find the chunk in the list. A route chunk names its route file. A shared chunk names the first module in it, for example `trends` holds Recharts.
2. Build the web with `pnpm --filter @mediwise/web exec vite build`. Vite prints each file with its gzip size.
3. Find the import that added the bytes. Make it smaller, or load it with a dynamic `import()` from the route that needs it.

### Update the baseline

Update the baseline only when the growth is necessary, or when a chunk is new, renamed or removed.

1. Run `pnpm size --update`. It builds and writes the current sizes to `scripts/bundle-size.json`.
2. Commit `scripts/bundle-size.json` in a commit of its own, for example `chore(web): bundle size baseline for the charts page`.
3. In the pull request, give the reason for the growth.

## Performance budgets

`pnpm perf` runs `apps/e2e/perf/budgets.spec.ts` with `apps/e2e/playwright.perf.config.ts`. The CI `perf` job runs it in parallel with the `e2e` job, after the `check` job.

- It needs the local Supabase of the e2e suite (`supabase start --workdir apps/e2e`). The API is the same as in `pnpm e2e`: `CLAUDE_STUB=true` and no Claude key.
- It builds the web and the landing for production and serves them with gzip from `apps/e2e/perf/serve.ts`: the web on port 5174, the landing on port 3200. A dev server or an uncompressed build gives scores that are too low.
- It makes a new user with the dense history fixture (12 reports in 10 weeks, `db:seed-history`).
- Lighthouse 12.8.2 runs 3 times on Home, the latest report, `/trends` and the landing, with mobile emulation and simulated slow 4G. The test uses the median of the 3 scores in each category.
- The CPU slowdown is 4x on a machine with a Lighthouse benchmark index of 2000, and scales with the index of the machine. The log shows the index and the slowdown. The reason is in [DESIGN.md](DESIGN.md#performance-budgets-medi-88).
- The budgets are in the list of pages in the spec. The numbers and the reason for each are in [DESIGN.md](DESIGN.md#performance-budgets-medi-88).
- INP: with a 4x CPU throttle, the test clicks every category, direction and status chip and both sort buttons on `/trends` two times, at 1440 by 900 and again at 390 by 844, where the phone tab bar renders. It waits for the paint after each click, as a person does. INP is the slowest interaction (Event Timing). The test does this on 3 page loads and fails when the median is 250 ms or more. The ticket limit is 200 ms. The reason for 250 ms is in [DESIGN.md](DESIGN.md#performance-budgets-medi-88).
- Tab taps: with the same throttle at 390 by 844, the test opens Home and taps the Reports, Trends and Home tabs. Each tap waits for its page and the paint. It fails when the median of the slowest tap of 3 page loads is 250 ms or more.

### Read a failing budget

1. The job log shows one line for each page, for example `lighthouse home: {"performance":61,...}, performance runs 58 61 64`. The failure names the category, the score and the budget.
2. Download the `perf-report` artifact and open `playwright-report/index.html`. Each Lighthouse test has the 3 HTML reports attached. Open one and read the failed audits.
3. A drop in performance comes from more JavaScript (see [Bundle size](#bundle-size)), a slower first render or more main thread work. Compare LCP and Total Blocking Time with a run on `main`.
4. For INP, the log line names the control of the slowest interaction, for example `248 (trend-category-lipids)`. Open `/trends` in Chrome, set a 4x CPU slowdown in the DevTools Performance panel, record a click on that control and find the long task after the click.
5. One run can be slow because the CI machine is busy. When the scores of the 3 runs differ by more than 20 points, run the job again before you change code.

### Update a budget

- Raise a budget when the scores stay higher in CI. Set a performance budget 10 points under the lowest CI median of at least two runs, because one run moves by about 7 points. Record the numbers in DESIGN.md. Do not use numbers from a laptop.
- Never lower a budget to make a change pass. When a change must make a page slower, write the reason in the pull request and in DESIGN.md, in the same commit as the new budget.
- On a machine with 8 GB of RAM, do not run `pnpm perf` together with `pnpm check`, `pnpm dev` or `pnpm e2e`. Other work on the machine makes the scores lower.

## Supply-chain scan

`.github/workflows/supply-chain-scan.yml` looks for the signs of a self-spreading npm worm. Such a worm adds an install hook to a package, writes loader or exfil files, and publishes stolen credentials. The workflow runs on a push to `main`, on each pull request, every day at 03:30 UTC, and by hand from the Actions tab. It uses no secrets. Each action is pinned to a commit SHA.

| Step | What it catches |
| --- | --- |
| IOC filenames | A known worm file in the repo, for example `setup_bun.js`, `bun_environment.js` or `truffleSecrets.json`. It does not look in `node_modules` or `.git`. |
| IOC strings | A known exfil host or secret scanner name in a file of the repo. The list is in the workflow. It does not look in `node_modules`, `.git` or the workflow file, so do not copy a pattern into another file. |
| Lockfile | A package in `pnpm-lock.yaml` that comes from a host other than `registry.npmjs.org`: a tarball URL, a git repo, a directory or a `file:` version. It also fails when `.npmrc` or `pnpm-workspace.yaml` sets a different registry. |
| Install-hook allowlist | A package with a `preinstall`, `install` or `postinstall` script, or a `binding.gyp` file, that is not in the allowlist. The step reads each package in `node_modules/.pnpm`, each hoisted package and each workspace package. |
| pnpm audit | A known advisory. A high advisory shows in the log. A critical advisory fails the job. |

The install runs with `pnpm install --frozen-lockfile --ignore-scripts`, so no install script runs before the allowlist step.

### Add a package to the allowlist

The allowlist is the `ALLOW` value of the install-hook step. Each name has a one-line reason in the comment above the step.

1. Read the failure line in the job log. It names the package, the version and the hook.
2. Run `pnpm why <name>` to find the dependency that brings in the package.
3. Read the hook script in `node_modules/.pnpm/<name>@<version>/node_modules/<name>/`. Make sure that it does only what the package needs, for example a download of its own binary from `registry.npmjs.org`. Make sure that the repository field points to the upstream project.
4. Add the name to `ALLOW`. Add a line with the reason to the comment above the step.
5. When the hook must run on install, also add the name to `allowBuilds` in `pnpm-workspace.yaml`.

Do not add a package that you did not read. When the hook sends data to an unknown host or reads tokens or credentials, remove the dependency and tell the maintainer.
