# Deploy

Production costs zero until users arrive. It runs in three places:

| Part | Where | Source |
|---|---|---|
| Web (`apps/web`) | Cloudflare Pages project `mediwise`, `https://mediwise.pages.dev`, static Vite build uploaded with `wrangler pages deploy` | `apps/web/public/_redirects` |
| Landing page (`apps/landing`) | Cloudflare Pages project `mediwise-landing`, `https://mediwise-landing.pages.dev`, static Next.js export uploaded with `wrangler pages deploy` | `apps/landing/next.config.ts` |
| API and job worker (`apps/api`) | Render free web service `mediwise-api` (`srv-db6atpg473hc73dqkuo0`), `https://mediwise-api-ij2v.onrender.com`, Docker, region Singapore | `apps/api/Dockerfile`, `render.yaml` |
| Postgres, Auth, Storage | Supabase project `mediwise-prod` (ref `adnvhcharmqykmlyrepq`, `ap-south-1` Mumbai) | `apps/api/src/db/migrations` |

CI (`.github/workflows/check.yml`) runs `pnpm check` on every push and pull request.

Never commit a secret. Put API values in the Render dashboard only. The web values live in `apps/web/.env.prod` in the main checkout, and git ignores it. `apps/api/.env.prod` is the local copy of the API values.

## Build

- `pnpm build` from the root builds `packages/engine` and `packages/shared` to `dist` first, then `apps/api` and `apps/web`. Turbo orders the builds through `dependsOn: ["^build"]`.
- The Dockerfile runs the same build and starts the API with `node dist/index.js`. `tsx` is a dev dependency only.
- Each package `exports` map sends `types` and the `development` condition to `src`, and every other import to `dist`. Plain `node` and `vite build` use `dist`. Vitest, Vite dev and the `tsx` scripts (which pass `--conditions=development`) use `src`, so they need no build first.
- Check a build locally without Docker:

  ```sh
  pnpm build
  cd apps/api && node --env-file=.env dist/index.js
  curl http://localhost:3001/health
  ```

## Render free: sleep and wake

- Render stops a free web service after 15 minutes with no incoming request.
- The next request wakes it. That first request can take up to a minute. The web waits for the answer.
- The job worker sleeps with the API. A report upload wakes the API, and the web asks for the report status while it waits, so the API stays awake until the report is done.
- A job cut off by a stop is claimed again after 10 minutes.
- The upload rate limit counts in memory, so a stop resets it.

## Environment variables

### API (Render service, Environment)

`render.yaml` declares every variable. Render asks for each `sync: false` value when you create the Blueprint.

| Variable | Required | Value in production |
|---|---|---|
| `DATABASE_URL` | yes | Supabase pooler URI for the `mediwise_app` role (Supabase dashboard, Connect, Transaction pooler, port 6543). |
| `SUPABASE_URL` | yes | `https://adnvhcharmqykmlyrepq.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service role key of `mediwise-prod`. Server only. |
| `ANTHROPIC_API_KEY` | yes | Anthropic key for production. Without it, every report fails. |
| `WEB_ORIGIN` | yes | `https://mediwise.pages.dev`. No trailing slash. CORS allows this origin only. |
| `RUN_WORKER` | yes | `true`, set by `render.yaml`. The report worker runs only when this is `true`. |
| `SUPABASE_JWT_SECRET` | no | Set only if the project signs access tokens with HS256. ES256 and RS256 tokens verify against the public JWKS. |
| `ANTHROPIC_MODEL` | no | Default `claude-sonnet-5-5`. Maps the names that no alias matches. |
| `ANTHROPIC_EXTRACT_MODEL` | no | Default `claude-haiku-5-5`. Reads the values off the report. |
| `ANTHROPIC_NARRATIVE_MODEL` | no | Default `claude-haiku-5-5`. Writes the report narrative. |
| `ANTHROPIC_FINDINGS_MODEL` | no | Default `claude-haiku-5-5`. Writes the text of each finding. |
| `CLAUDE_MONTHLY_CAP_CENTS` | no | Default `2000` (20 USD). Over the cap, the worker pauses every read and logs one warning per hour. Raise it and restart the service to resume the paused reads. |
| `CLAUDE_HARD_STOP` | no | Default `false`. Set `true` to refuse every new upload with a 503. Reads already in the queue still run. |
| `ADMIN_USER_ID` | no | Supabase user id that can call `GET /admin/spend` and that gets `costCents` in `GET /reports/:id`. Empty means the route answers 404 for everyone and no report shows a cost. |
| `PAYMENTS_ENABLED` | no | Default `false`. When `false`, every `/payments` route answers 404. Set `true` only when the maintainer says enable. |
| `CASHFREE_APP_ID` | when payments are on | Cashfree app id. The API does not start with `PAYMENTS_ENABLED=true` and no app id. |
| `CASHFREE_SECRET_KEY` | when payments are on | Cashfree secret key. It also verifies the webhook signature. Server only. |
| `CASHFREE_ENV` | no | `sandbox` (default) or `production`. Use `production` only with production keys. |
| `PAYMENTS_WEBHOOK_URL` | no | `<API URL>/payments/webhook`. Sent with each order as `notify_url`, so payment webhooks arrive even before the dashboard webhook is set. Refund webhooks still need the dashboard webhook. |
| `PORT` | no | Render sets it. Do not set it. |
| `NODE_ENV`, `NO_COLOR` | no | The Dockerfile sets `production` and `1`. |
| `DEV_USER_ID` | no | Used only when `NODE_ENV=test`. Do not set it. |

### Web (`apps/web/.env.prod`, read by the local build)

Vite reads the `VITE_` variables at build time on your machine. The Pages project has no build of its own, so variables set in the Cloudflare dashboard do nothing. Build and deploy again after you change one.

| Variable | Required | Value in production |
|---|---|---|
| `VITE_API_URL` | yes | `https://mediwise-api-ij2v.onrender.com`. No trailing slash. |
| `VITE_SUPABASE_URL` | yes | `https://adnvhcharmqykmlyrepq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Anon (publishable) key of `mediwise-prod`. |
| `VITE_PAYMENTS_ENABLED` | no | Default `false`. `true` shows the credit packs and the Buy button. Set it with `PAYMENTS_ENABLED=true` on the API, never alone. |
| `VITE_CASHFREE_MODE` | no | `sandbox` (default) or `production`. Must match `CASHFREE_ENV`. |

## First deploy (runbook)

Do the steps in this order. The API URL must exist before the web build, and the web URL must exist before CORS and Auth work.

### 1. GitHub

1. Push `main` to `github.com/theyashgupta/mediwise` (through `/ship`).
2. Open the Actions tab. Make sure the `check` workflow is green.

### 2. Render (API)

1. Sign in at dashboard.render.com with GitHub. No payment card is needed for the free plan.
2. Click New, Blueprint. Connect the `theyashgupta/mediwise` repository. Give Render access to this repository only.
3. Render reads `render.yaml` and shows one service: `mediwise-api`, Docker, Free, Singapore.
4. Enter the `sync: false` values: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. For `WEB_ORIGIN`, enter `http://localhost:5173` for now. Step 4 sets the real value.
5. Click Apply. Wait for the first deploy to show Live.
6. Copy the service URL (`https://mediwise-api-ij2v.onrender.com`). This is `VITE_API_URL`.
7. Check: `curl https://mediwise-api-ij2v.onrender.com/health` returns `{"status":"ok",...}`.

### 3. Cloudflare Pages (web)

The web deploys with `wrangler pages deploy` from a local build, not from a Cloudflare git build. The project `mediwise` has no Git provider connected.

1. Log in once: `npx wrangler login`.
2. Make sure `apps/web/.env.prod` holds the web variables from the table above.
3. From the repository root, build and deploy (see "Deploy the web" below for the exact command).
4. The first deploy creates the project if it does not exist. Wrangler asks for the production branch. Enter `main`.
5. `apps/web/public/_redirects` sends every path to `index.html`, so a deep link such as `/reports/upload` loads the app.

### 4. Connect the parts

1. Render, `mediwise-api`, Environment: set `WEB_ORIGIN` to `https://mediwise.pages.dev`. Save. Render redeploys the API.
2. Supabase dashboard, `mediwise-prod`, Authentication, URL Configuration:
   - Site URL: `https://mediwise.pages.dev`
   - Redirect URLs: add `https://mediwise.pages.dev/**`. This covers `/` (sign up), `/auth/callback` (Google) and `/reset-password` (password reset).
   - Keep `http://localhost:5173/**` only on `mediwise-dev`, not on production.
3. Google sign-in: follow "Google sign-in" below. The web needs no new variable and no new deploy.

### 5. Verify

1. Create a smoke test user in Supabase, Authentication, Users, Add user. Select Auto Confirm User.
2. Run the smoke test (next section). Every line must say `PASS`.
3. Open the web URL. Sign in. Upload a report. Make sure the report goes to `done` and shows a score.

## Google sign-in

The sign-in and sign-up pages always show "Continue with Google". When the Google provider is off in a Supabase project, the button shows "Google sign-in is not available yet" and the email form still works.

Flow: the web calls `signInWithOAuth` with `redirectTo` = `<web origin>/auth/callback?next=<page>`. Google returns to Supabase, Supabase returns to `/auth/callback` with a PKCE code, and the Supabase client swaps the code for a session. The callback route then opens `<page>`, or `/`. A cancel or an error opens `/login` with a message.

### 1. Google Cloud OAuth client (maintainer)

1. Open console.cloud.google.com. Select or create the project `mediwise`.
2. Open APIs and Services, OAuth consent screen. Set user type to External.
3. Enter the app name `MediWise`, a support email and a developer contact email.
4. Add the scopes `openid`, `.../auth/userinfo.email` and `.../auth/userinfo.profile`. These scopes need no Google review.
5. Add `mediwise.pages.dev` as an authorised domain.
6. Click Publish app. While the app is in Testing, only the listed test users can sign in.
7. Open Credentials. Click Create credentials, OAuth client ID. Select Web application. Name it `mediwise-web`.
8. Authorised JavaScript origins: add `http://localhost:5173` and `https://mediwise.pages.dev`.
9. Authorised redirect URIs: add these two URIs.
   - `https://wjdbyuzwefmsmnbvgrdt.supabase.co/auth/v1/callback` (dev, `mediwise-dev`)
   - `https://adnvhcharmqykmlyrepq.supabase.co/auth/v1/callback` (prod, `mediwise-prod`)
10. Click Create. Put the client ID in `GOOGLE_CLIENT_ID` and the client secret in `GOOGLE_CLIENT_SECRET`. Use the env vault. Do not paste them in chat.

### 2. Turn on the provider in Supabase (orchestrator)

Make a scratch folder outside the repository with one file, `supabase/config.toml`:

```toml
project_id = "mediwise"

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
skip_nonce_check = false
```

`config push` changes only the properties that the file declares. All other auth settings stay as they are.

1. Preview dev: `~/.claude/scripts/with-env.sh supabase config diff --workdir <scratch> --project-ref wjdbyuzwefmsmnbvgrdt`. Make sure that only `auth.external.google` shows as `update` or `local_only`.
2. Push dev: `~/.claude/scripts/with-env.sh supabase config push --workdir <scratch> --project-ref wjdbyuzwefmsmnbvgrdt`. Answer yes only for the auth change.
3. Do steps 1 and 2 again with `--project-ref adnvhcharmqykmlyrepq` for prod.
4. Make sure each project has the web URL in Authentication, URL Configuration, Redirect URLs: `http://localhost:5173/**` on dev, `https://mediwise.pages.dev/**` on prod.

### 3. Verify

1. Open `/login`. Click Continue with Google. Select an account. The dashboard opens.
2. Open Settings. The name is the name on the Google account. Security says "Your account is linked to Google."
3. Sign out. Click Continue with Google, then close the Google page with Cancel or Back. The sign-in page shows "You stopped the Google sign-in." The browser console shows no error.

## Smoke test

`scripts/smoke.sh` checks: `/health` (it waits up to 2 minutes for Render to wake), CORS for the web origin, the SPA rewrite, sign in through Supabase, `GET /me`, create a profile, list its reports, delete the profile. It needs `curl` and `jq`.

```sh
API_URL=https://mediwise-api-ij2v.onrender.com \
WEB_URL=https://mediwise.pages.dev \
SUPABASE_URL=https://adnvhcharmqykmlyrepq.supabase.co \
SUPABASE_ANON_KEY=<anon key> \
SMOKE_EMAIL=<smoke user email> \
SMOKE_PASSWORD=<smoke user password> \
scripts/smoke.sh
```

Do not type a secret into a shared terminal log. Load the values from a git-ignored file with `set -a; . ./smoke.env; set +a` first.

## Deploy a change

- Merge to `main` and push. Render builds and deploys `main` on its own.
- The web does not deploy on push. Deploy it by hand after the merge (next section).
- Render waits for `/health` to answer 200 before it moves traffic to the new deploy. A failed health check keeps the old deploy live.
- On `SIGTERM` the API lets the job in hand finish, then exits.
- A wrangler deploy with `--branch` set to any name other than `main` is a preview. CORS blocks preview URLs, because `WEB_ORIGIN` names the production origin only.

## Deploy the web

Run from the repository root of the main checkout, on an up-to-date `main`:

```sh
(cd apps/web && set -a && . ./.env.prod && set +a && VITE_API_URL=https://mediwise-api-ij2v.onrender.com pnpm build)
npx wrangler pages deploy apps/web/dist --project-name mediwise --branch main
```

The first line builds with the production variables. It sets `VITE_API_URL` on the command line, because an empty value in `.env.prod` makes the web call `http://localhost:3001`. The second line uploads `apps/web/dist` as the production deploy of `https://mediwise.pages.dev`. Wrangler prints a URL for the new deploy.

## Deploy the landing page

The landing page is a static Next.js export. It has no environment variables. Run from the repository root of the main checkout, on an up-to-date `main`:

```sh
pnpm turbo run build --filter @mediwise/landing
npx wrangler pages deploy apps/landing/out --project-name mediwise-landing --branch main
```

- The first line builds `packages/engine` and `packages/shared` first, then writes the page to `apps/landing/out`. The build needs network access, because `next/font` downloads Inter, Instrument Serif and JetBrains Mono from Google Fonts.
- The build copies the favicons and `og-image.png` from `apps/web/public`. After the logo changes, run `node scripts/generate-brand-assets.mjs`, then build and deploy the landing page again.
- The prices come from `apps/api/src/modules/payments/payments.config.ts` and the counts come from the engine catalog when the page builds. After a change to either file, build and deploy the landing page again.
- The links to the app (Sign in, Read my report, the policy pages) point to `https://mediwise.pages.dev`. The address is in `apps/landing/src/lib/site.ts`.
- The project `mediwise-landing` exists. Do not create it again. A deploy with `--branch` set to any name other than `main` is a preview.

To check a build before you deploy it, serve `apps/landing/out` with a static server that compresses, such as `npx serve apps/landing/out`. Python's `http.server` does not compress, so Lighthouse scores it too low.

## Database migrations

Migrations are SQL files in `apps/api/src/db/migrations`, applied by Drizzle. `0000` to `0006` are applied on `mediwise-prod` (2026-10-12).

1. Apply a new migration to `mediwise-dev` first: `pnpm --filter @mediwise/api db:migrate`.
2. Apply it to production before you merge code that needs it. Use a connection string of a role that owns the tables. A shell value wins over `apps/api/.env`:

   ```sh
   cd apps/api
   (set -a; . ./.env.prod; set +a; pnpm db:migrate)
   ```

3. Read the migration SQL before you apply it. If it drops or renames a column, stop and ask the maintainer.

## Roll back

- Web: Cloudflare Pages, the project, Deployments. Open the last good production deploy, click the menu, Rollback to this deployment. This does not rebuild.
- Landing page: the same steps in the project `mediwise-landing`.
- API: Render, `mediwise-api`, Events. Open the last good deploy, click Rollback.
- Database: Drizzle has no down migrations. Write a new migration that reverses the change, then apply it. Before a risky migration, take a backup in Supabase, Database, Backups.
- A rollback of the API does not undo a migration. Keep migrations additive, so the previous API version still runs on the new schema.

## One-off commands

Run these from `apps/api` with the target environment loaded.

| Command | What it does |
|---|---|
| `pnpm db:reread-reports` | Reads every `done` report again with Claude. It classifies the pages of every file again (one Haiku call per file) and stores the new classes. Add `--keep-classes` to use the stored classes. One Claude extraction and one narrative call per report. A report that fails stays `done` with its old data. |
| `pnpm db:claim-dev-data <user-id>` | Moves every profile of `DEV_USER_ID` to a Supabase user. Dev only. |

## Logs

- API: Render, `mediwise-api`, Logs. Every request log line starts with `[<request id>]`. The API returns the same id in the `X-Request-Id` response header, so a user report can be matched to its log lines.
- Worker lines start with `worker job=<id>` or `process_report report=<id>`.
- Web: the web is static and built on your machine, so there are no build or runtime logs on Cloudflare. `npx wrangler pages deployment list --project-name mediwise` lists the deploys.

## Production limits in the API

- Security headers on every response (`hono/secure-headers`).
- Request body limit of 100 KB. Files go to Supabase Storage through signed URLs, so the API receives JSON only.
- `POST /reports`: 10 per hour per user. The 11th answers 429 with `Retry-After`.
- CORS allows `WEB_ORIGIN` only.

## Report credits

Each read uses one credit. A new account has 0 credits. To give credits, run this from a checkout with the production `apps/api/.env`:

1. `pnpm --filter @mediwise/api credits:grant <email> <n> <reason>`. Example: `credits:grant asha@example.com 5 beta tester`.
2. Read the log line. It shows the user id and the number of credits.

To see this month's Claude spend, call `GET /admin/spend` with the access token of the `ADMIN_USER_ID` account. The response also has `purchases` (orders paid this month) and `revenuePaise` (their amounts in paise, before refunds).

## Payments (Cashfree)

Users buy report credits through Cashfree Payment Gateway. The packs and prices are in `apps/api/src/modules/payments/payments.config.ts`. The amount comes from that file, never from the web.

The policy pages `/terms`, `/privacy`, `/refunds` and `/contact` are public. Cashfree checks them before it approves the account. Fill the contact details in `apps/web/src/modules/payments/config/policies.ts` first.

### Before you merge MEDI-33

Apply migrations `0013_payment_orders` and `0014_one_purchase_per_order` to `mediwise-prod` before you deploy this code. Do this also when payments stay off. Every insert into `credits_ledger` names the new columns, so without `0013` each report read fails. Use the steps in Database migrations.

### Payments go-live checklist

Do the steps in this order. Do not set a flag to `true` before step 5 is complete.

1. Policy placeholders. In `apps/web/src/modules/payments/config/policies.ts`, replace `[contact email]`, `[legal name of the business owner]` and `[postal address in India]`. Change `policyUpdated` to the date of the change. Open `/contact` and make sure that no square brackets show.
2. Prices. Set the real packs in `apps/api/src/modules/payments/payments.config.ts`. The amount is in paise. The current packs are placeholders: 1 credit 4900, 5 credits 19900, 20 credits 59900.
3. Production keys. In the Cashfree production dashboard, go to Developers, API Keys. On the Render service, set these variables:
   - `CASHFREE_APP_ID`: the production app id.
   - `CASHFREE_SECRET_KEY`: the production secret key.
   - `CASHFREE_ENV`: `production`.
   - `PAYMENTS_WEBHOOK_URL`: `https://mediwise-api-ij2v.onrender.com/payments/webhook`.
4. Webhook registration. In the Cashfree production dashboard:
   1. Go to Developers, then Webhooks.
   2. Add the URL `https://mediwise-api-ij2v.onrender.com/payments/webhook`.
   3. Select the payment success event and the refund event.
   4. Save.

   Without this step, a refund does not remove credits. `PAYMENTS_WEBHOOK_URL` sends payment events only.
5. Database. Make sure that `0013` and `0014` are on `mediwise-prod` (see Before you merge MEDI-33).
6. API flag. On the Render service, set `PAYMENTS_ENABLED=true`. Restart the service.
7. Web flag. In `apps/web/.env.prod`, set `VITE_PAYMENTS_ENABLED=true` and `VITE_CASHFREE_MODE=production`. Build and deploy the web (see Deploy the web).
8. Check. Sign in on `https://mediwise.pages.dev/credits`. Buy the 1-credit pack with a real payment. Make sure that the balance increases by 1. Refund the payment in the Cashfree dashboard. Make sure that the balance decreases by 1. Call `GET /admin/spend` and make sure that `purchases` is 1.

To turn off payments, set both flags to `false`. A payment that arrives while the API flag is `false` gets a 404. Cashfree retries it 3 times in about 45 minutes and then stops. Give those credits with `credits:grant`.

A refund: refund the payment in the Cashfree dashboard. The refund webhook removes the refunded credits from the balance. A partial refund removes its share of the pack, rounded.
