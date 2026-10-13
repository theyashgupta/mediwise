# Testing

MediWise has three test layers. CI runs all three on every push and every pull request.

| Layer | Command | What it covers |
| --- | --- | --- |
| Unit | `pnpm check` | Typecheck, lint and Vitest in every package, with rendered page tests for the web. The rules are in [.claude/rules/testing.md](../.claude/rules/testing.md). |
| Coverage | `pnpm coverage` | The unit tests again with V8 coverage. It prints a summary per package and fails below the package threshold. |
| Database | `pnpm test:db` | The SQL in `apps/api` against a real Postgres: credits ledger, purchases, the Claude spend cap, and the history queries (earlier values, same-day order, trends, compare, retests). |
| End-to-end | `pnpm e2e` | The main flow in a real browser, against a local Supabase and the real API and web. |

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

`pnpm coverage` runs the `coverage` script of each package that has unit tests: api, web, landing, engine, shared and design-tokens. The CI `check` job runs it after `pnpm check`, so the job log shows the four numbers (statements, branches, functions, lines) of each package.

- Coverage counts every `.ts` and `.tsx` file under `src`, also a file that no test loads. Test files are not counted.
- Each package sets four thresholds in its `coverage` script, at the numbers of 2026-10-13 rounded down to a whole percent. A change that drops a package below a threshold fails the job.
- When coverage goes up, raise the thresholds in the same pull request. Never lower a threshold to make a change pass.
- `packages/config` has no `coverage` script. Its test checks the ESLint config, which has no code to count.

## Database tests

A file that ends in `.db.test.ts` runs only in the db project (`apps/api/vitest.db.config.ts`). `pnpm check` never runs it.

- The project uses the local Supabase of the e2e suite. Before each run it drops and creates the database `mediwise_test` and applies every Drizzle migration. The e2e data in the `postgres` database is not touched.
- It runs with `CLAUDE_STUB=true`, an empty `ANTHROPIC_API_KEY` and `CLAUDE_MONTHLY_CAP_CENTS=100`. It never calls Claude or Supabase auth.
- Each test makes its own user id with `randomUUID()`, so tests do not share rows.
- History tests seed the dense fixture with `insertDenseHistory` from `apps/api/src/db/dense-history.ts`, the same rows as `db:seed-history`. A test named "audit row N" covers row N of [research/continuous-history.md](research/continuous-history.md).
- In CI the `e2e` job runs `pnpm test:db` after `supabase start` and before `pnpm e2e`.

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

A spec file, `apps/e2e/tests/dense-history.spec.ts`, signs up another user and seeds a profile with 12 reports in 10 weeks with `db:seed-history` (no upload, no Claude call). It checks that the Home score change compares two full panels, the New since strip with the narrow reports, the stale line, the glucose trend at 390 and 1440 px with no overlapping chart labels, and the compare page with the first and last report. The audit behind it is in [research/continuous-history.md](research/continuous-history.md).

A spec file, `apps/e2e/tests/follow-up.spec.ts`, signs up another user with three credits and a female member profile. In order, it:

1. Uploads `apps/api/fixtures/studies/usg-pelvis-2025-03-18.pdf`, a pelvis ultrasound with a 4.2 cm adnexal mass, and checks the study alert finding.
2. Uploads `usg-pelvis-2025-03-22.pdf`, a repeat scan of the abdomen and pelvis with no mass. The report shows the automatic link with its notice and Undo button (MEDI-79).
3. Opens the first report. The mass is not in Findings. The Settled block shows both study dates and the lab of the second scan (MEDI-67).
4. Uploads `sample-2025.pdf`, the third visit in 11 days. The profiles page proposes an episode. The test saves it and finds it in the episode list (MEDI-68).
5. Makes a share link and opens it in a new browser context with no session. The doctor export shows the lab (MEDI-58).
6. Downloads the CSV of the active profile from Settings and checks the vitamin D value (MEDI-62).
7. Switches the language to Hindi. The report page keeps the score and the values and shows Devanagari text (MEDI-64 and MEDI-66).

A spec file, `apps/e2e/tests/checkout.spec.ts`, buys the 5 credit pack on the credits page with payments on. See [No Cashfree call](#no-cashfree-call).

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
- `pnpm e2e` applies the Drizzle migrations to the local database. Then it starts the API on port 3101 and the web on port 5174, with the same commands as `pnpm dev`. The API and the web get the local Supabase URL and keys, not the values in `apps/*/.env`.
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
- The deploy workflows call `check.yml`, so a deploy waits for the `check` job and the `e2e` job.
