# Deploy

Production costs zero until users arrive. It runs in three places:

| Part | Where | Source |
|---|---|---|
| Web (`apps/web`) | Cloudflare Pages project `mediwise`, `https://app.mediwise.theyashgupta.me` (alias `https://mediwise.pages.dev`), static Vite build that GitHub Actions uploads with `wrangler pages deploy` | `apps/web/public/_redirects`, `.github/workflows/deploy-web.yml` |
| Landing page (`apps/landing`) | Cloudflare Pages project `mediwise-landing`, `https://mediwise.theyashgupta.me` (alias `https://mediwise-landing.pages.dev`), static Next.js export that GitHub Actions uploads with `wrangler pages deploy` | `apps/landing/next.config.ts`, `.github/workflows/deploy-landing.yml` |
| API and job worker (`apps/api`) | Render free web service `mediwise-api` (`srv-db6atpg473hc73dqkuo0`), `https://mediwise-api-ij2v.onrender.com`, Docker, region Singapore | `apps/api/Dockerfile`, `render.yaml` |
| Postgres, Auth, Storage | Supabase project `mediwise-prod` (ref `adnvhcharmqykmlyrepq`, `ap-south-1` Mumbai) | `apps/api/src/db/migrations` |

CI (`.github/workflows/check.yml`) runs `pnpm check` on every push and pull request. On a push to `main`, `deploy-web.yml` and `deploy-landing.yml` deploy the web and the landing page (see Deploy the web).

Never commit a secret. Put API values in the Render dashboard only. The web values live in the GitHub repository secrets and variables. `apps/web/.env.prod` in the main checkout holds a copy for the manual deploy, and git ignores it. `apps/api/.env.prod` is the local copy of the API values.

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
| `CORS_ORIGINS` | yes | `https://app.mediwise.theyashgupta.me,https://mediwise.pages.dev`, set by `render.yaml`. Origins that CORS allows, separated by commas. The first one is the main app origin, and Cashfree sends the buyer back there. |
| `WEB_ORIGIN` | no | Old name for one CORS origin. The API reads it only when `CORS_ORIGINS` is empty. Remove it after one release. |
| `RUN_WORKER` | yes | `true`, set by `render.yaml`. The report worker runs only when this is `true`. |
| `SUPABASE_JWT_SECRET` | no | Set only if the project signs access tokens with HS256. ES256 and RS256 tokens verify against the public JWKS. |
| `ANTHROPIC_MODEL` | no | Default `claude-sonnet-5-5`. Maps the names that no alias matches. |
| `ANTHROPIC_EXTRACT_MODEL` | no | Default `claude-haiku-5-5`. Reads the values off the report. |
| `ANTHROPIC_NARRATIVE_MODEL` | no | Default `claude-haiku-5-5`. Writes the report narrative. |
| `ANTHROPIC_FINDINGS_MODEL` | no | Default `claude-haiku-5-5`. Writes the text of each finding. |
| `CLAUDE_MONTHLY_CAP_CENTS` | no | Default `2000` (20 USD). Over the cap, the worker pauses every read and logs one warning per hour. Raise it and restart the service to resume the paused reads. |
| `CLAUDE_HARD_STOP` | no | Default `false`. Set `true` to refuse every new upload with a 503. Reads already in the queue still run. |
| `ADMIN_USER_ID` | no | Supabase user id that can open `/admin`, call `GET /admin/spend` and `GET /admin/overview`, and that gets `costCents` in `GET /reports/:id`. Empty means the route answers 404 for everyone and no report shows a cost. |
| `ASSISTANT_ENABLED` | no | Default `false`. When `false`, every assistant route answers 404 and the web hides the Ask page entry points. |
| `ASSISTANT_REVIEW` | no | Default `false`. With `ASSISTANT_ENABLED=true`, only accounts that agree to the review on the Ask page can ask. The web reads it from `GET /me`, so no web variable exists. |
| `PAYMENTS_ENABLED` | no | Default `false`. When `false`, every `/payments` route answers 404. Set `true` only when the maintainer says enable. |
| `CASHFREE_APP_ID` | when payments are on | Cashfree app id. The API does not start with `PAYMENTS_ENABLED=true` and no app id. |
| `CASHFREE_SECRET_KEY` | when payments are on | Cashfree secret key. It also verifies the webhook signature. Server only. |
| `CASHFREE_ENV` | no | `sandbox` (default) or `production`. Use `production` only with production keys. |
| `PAYMENTS_WEBHOOK_URL` | no | `<API URL>/payments/webhook`. Sent with each order as `notify_url`, so payment webhooks arrive even before the dashboard webhook is set. Refund webhooks still need the dashboard webhook. |
| `PORT` | no | Render sets it. Do not set it. |
| `NODE_ENV`, `NO_COLOR` | no | The Dockerfile sets `production` and `1`. |
| `DEV_USER_ID` | no | Used only when `NODE_ENV=test`. Do not set it. |

### Web and landing page (GitHub, Settings, Secrets and variables, Actions)

Vite reads the `VITE_` variables when the web builds. The deploy workflows build on GitHub Actions, so the values live in the repository secrets and variables. The Pages projects have no build of their own, so variables set in the Cloudflare dashboard do nothing. After you change a value, run the deploy again (Actions, `deploy-web`, Run workflow).

The orchestrator sets these. Use the exact names. A workflow never prints a secret.

| Name | Kind | Required | Value in production |
|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | secret | yes | Cloudflare API token with the Cloudflare Pages Edit permission. Both workflows use it. |
| `CLOUDFLARE_ACCOUNT_ID` | secret | yes | Cloudflare account id that owns `mediwise` and `mediwise-landing`. |
| `VITE_API_URL` | secret | yes | `https://mediwise-api-ij2v.onrender.com`. No trailing slash. |
| `VITE_SUPABASE_URL` | secret | yes | `https://adnvhcharmqykmlyrepq.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | secret | yes | Anon (publishable) key of `mediwise-prod`. |
| `VITE_PAYMENTS_ENABLED` | variable | no | Default `false`. `true` shows the credit packs and the Buy button. Set it with `PAYMENTS_ENABLED=true` on the API, never alone. |
| `VITE_CASHFREE_MODE` | variable | no | `sandbox` (default) or `production`. Must match `CASHFREE_ENV`. |

The workflows also set the public origins in plain text, because they are not secret: `VITE_APP_ORIGIN` and `VITE_LANDING_URL` for the web, `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` for the landing page. See Custom domains.

## First deploy (runbook)

Do the steps in this order. The API URL must exist before the web build, and the web URL must exist before CORS and Auth work.

### 1. GitHub

1. Push `main` to `github.com/theyashgupta/mediwise` (through `/ship`).
2. Open the Actions tab. Make sure the `check` workflow is green.

### 2. Render (API)

1. Sign in at dashboard.render.com with GitHub. No payment card is needed for the free plan.
2. Click New, Blueprint. Connect the `theyashgupta/mediwise` repository. Give Render access to this repository only.
3. Render reads `render.yaml` and shows one service: `mediwise-api`, Docker, Free, Singapore.
4. Enter the `sync: false` values: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`. `render.yaml` sets `CORS_ORIGINS`.
5. Click Apply. Wait for the first deploy to show Live.
6. Copy the service URL (`https://mediwise-api-ij2v.onrender.com`). This is `VITE_API_URL`.
7. Check: `curl https://mediwise-api-ij2v.onrender.com/health` returns `{"status":"ok",...}`.

### 3. Cloudflare Pages (web)

GitHub Actions builds the web and deploys it with `wrangler pages deploy`. Cloudflare does not build from git. The project `mediwise` has no Git provider connected.

1. Set the GitHub secrets and variables from the table above.
2. Create the project with one manual deploy (see "Manual fallback" in Deploy the web). Log in first with `npx wrangler login`. Wrangler asks for the production branch. Enter `main`. The workflow cannot answer this question, so it needs a project that exists.
3. After that, each push to `main` deploys the web.
4. `apps/web/public/_redirects` sends every path to `index.html`, so a deep link such as `/reports/upload` loads the app.

### 4. Connect the parts

1. Render, `mediwise-api`, Environment: make sure that `CORS_ORIGINS` has the web origins (see Custom domains).
2. Supabase dashboard, `mediwise-prod`, Authentication, URL Configuration:
   - Site URL: `https://app.mediwise.theyashgupta.me`
   - Redirect URLs: add `https://app.mediwise.theyashgupta.me/**` and `https://mediwise.pages.dev/**`. This covers `/` (sign up), `/auth/callback` (Google) and `/reset-password` (password reset).
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
5. Add `theyashgupta.me` and `mediwise.pages.dev` as authorised domains.
6. Click Publish app. While the app is in Testing, only the listed test users can sign in.
7. Open Credentials. Click Create credentials, OAuth client ID. Select Web application. Name it `mediwise-web`.
8. Authorised JavaScript origins: add `http://localhost:5173`, `https://app.mediwise.theyashgupta.me` and `https://mediwise.pages.dev`.
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
4. Make sure each project has the web URL in Authentication, URL Configuration, Redirect URLs: `http://localhost:5173/**` on dev, `https://app.mediwise.theyashgupta.me/**` and `https://mediwise.pages.dev/**` on prod.

### 3. Verify

1. Open `/login`. Click Continue with Google. Select an account. The dashboard opens.
2. Open Settings. The name is the name on the Google account. Security says "Your account is linked to Google."
3. Sign out. Click Continue with Google, then close the Google page with Cancel or Back. The sign-in page shows "You stopped the Google sign-in." The browser console shows no error.

## Auth email

Supabase Auth sends the sign-up, sign-in link, password reset, email change and invite emails through Resend SMTP. The sender is `MediWise <no-reply@mediwise.theyashgupta.me>`. The templates are in `supabase/templates`. `node scripts/render-email-previews.mjs` checks each template and writes the previews to `docs/design/emails`.

Limits: Resend free sends 100 emails a day and 3,000 a month. Dev and prod use the same Resend account, so they share this limit. Supabase sends at most 30 auth emails an hour per project (`email_sent` below).

When you run the app locally against dev, never sign up or ask for a reset link with a made-up address on a real domain, such as `theyashgupta.me`: the email bounces, and Supabase sends the maintainer a bounce warning. Use Resend's test inbox, `delivered+<purpose>@resend.dev`, which accepts every email and never bounces.

### Env-vault names

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | A Resend API key with Sending access for the domain `mediwise.theyashgupta.me` only |

### 1. Resend domain (maintainer)

1. Open resend.com. Make an account. Open Domains and click Add Domain.
2. Enter `mediwise.theyashgupta.me`. Select the region Tokyo (`ap-northeast-1`), the nearest region to the Supabase projects in Mumbai.
3. Open the domain settings. Make sure that Click tracking and Open tracking are off.
4. Open API Keys. Make a key named `mediwise-supabase`, with permission Sending access and the domain `mediwise.theyashgupta.me`. Put it in `SMTP_PASS` in the env vault. Do not paste it in chat.
5. Put the other three values from the table above in the env vault.

### 2. DNS at GoDaddy (orchestrator)

Add these records in the zone `theyashgupta.me`. Copy the MX and DKIM values exactly from the Resend domain page. The values below show the form for the Tokyo region.

| Type | Name | Value | Priority |
|---|---|---|---|
| MX | `send.mediwise` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send.mediwise` | `v=spf1 include:amazonses.com ~all` | |
| TXT | `resend._domainkey.mediwise` | `p=<public key from the Resend domain page>` | |
| TXT | `_dmarc.mediwise` | `v=DMARC1; p=none;` | |

- SPF: the `send.mediwise` records cover the bounce address. Resend sends with that return path, so SPF passes for the subdomain.
- DKIM: the `resend._domainkey.mediwise` key signs every email for `mediwise.theyashgupta.me`.
- DMARC: `p=none` reports only. After one week with no failed emails, change it to `v=DMARC1; p=quarantine;`.
- Do not add a record with the name `mediwise`. That name is a CNAME to the landing page, and a CNAME cannot share its name with another record.
- Do not change a record on the apex `theyashgupta.me` (`@`). The apex carries iCloud Mail.

Click Verify DNS Records on the Resend domain page. Wait until the domain shows Verified.

### 3. Push the settings to Supabase (orchestrator)

Make a scratch folder outside the repository. Copy the templates into it with `mkdir -p <scratch>/supabase && cp -R supabase/templates <scratch>/supabase/`. Then add the file `<scratch>/supabase/config.toml`:

```toml
project_id = "mediwise"

[auth.rate_limit]
email_sent = 30

[auth.email]
otp_expiry = 3600

[auth.email.smtp]
enabled = true
host = "env(SMTP_HOST)"
port = "env(SMTP_PORT)"
user = "env(SMTP_USER)"
pass = "env(SMTP_PASS)"
admin_email = "no-reply@mediwise.theyashgupta.me"
sender_name = "MediWise"

[auth.email.template.confirmation]
subject = "Confirm your MediWise account"
content_path = "./supabase/templates/confirm-signup.html"

[auth.email.template.magic_link]
subject = "Your MediWise sign-in link"
content_path = "./supabase/templates/magic-link.html"

[auth.email.template.recovery]
subject = "Reset your MediWise password"
content_path = "./supabase/templates/recovery.html"

[auth.email.template.email_change]
subject = "Confirm your new MediWise email address"
content_path = "./supabase/templates/email-change.html"

[auth.email.template.invite]
subject = "You are invited to MediWise"
content_path = "./supabase/templates/invite.html"
```

The emails say "The link expires after 1 hour", so `otp_expiry` stays `3600`. Both projects had `3600` on 2026-10-13. The push fails with a parse error when an `SMTP_*` value is missing from the environment.

1. Preview dev: `~/.claude/scripts/with-env.sh supabase config diff --workdir <scratch> --project-ref wjdbyuzwefmsmnbvgrdt`. Make sure that only `auth.email.smtp.*`, `auth.email.template.*.subject` and `auth.rate_limit.email_sent` show as `update` or `local_only`. Lines that show as `remote_only` do not change.
2. Push dev: `~/.claude/scripts/with-env.sh supabase config push --workdir <scratch> --project-ref wjdbyuzwefmsmnbvgrdt`. Answer yes only for the auth change.
3. Do steps 1 and 2 again with `--project-ref adnvhcharmqykmlyrepq` for prod.

### 4. Verify

1. On dev, sign up with a new address that you can read. The email comes from `MediWise <no-reply@mediwise.theyashgupta.me>` and looks like `docs/design/emails/confirm-signup.png`.
2. Click the button in the same browser. The app opens and you are signed in.
3. On the sign-in page, click "Forgot your password?" and enter the same address. The email looks like `docs/design/emails/recovery.png`.
4. In Gmail, open the email menu and click Show original. SPF, DKIM and DMARC each show `PASS`.
5. Do steps 1 to 4 again on prod.

## Smoke test

`scripts/smoke.sh` checks: `/health` (it waits up to 2 minutes for Render to wake), CORS for the web origin, the SPA rewrite, the `noindex` header on `/share/*`, the public share route (`GET /share/:token` answers 404 without sign-in, not 401), sign in through Supabase, `GET /me`, create a profile, list its reports, download its CSV (`GET /profiles/:id/export.csv` starts with the BOM and the header row), delete the profile. It needs `curl` and `jq`.

```sh
API_URL=https://mediwise-api-ij2v.onrender.com \
WEB_URL=https://app.mediwise.theyashgupta.me \
SUPABASE_URL=https://adnvhcharmqykmlyrepq.supabase.co \
SUPABASE_ANON_KEY=<anon key> \
SMOKE_EMAIL=<smoke user email> \
SMOKE_PASSWORD=<smoke user password> \
scripts/smoke.sh
```

Do not type a secret into a shared terminal log. Load the values from a git-ignored file with `set -a; . ./smoke.env; set +a` first.

## Share from WhatsApp on Android

The manifest `share_target` sends a shared PDF or photo to `POST /share-target`. `sw.js` keeps the files in Cache Storage and opens `/reports/upload?shared=1`. Only an installed app shows in the Android share sheet. iOS Safari has no share target.

Do this test on an Android phone after each deploy that changes `sw.js` or the manifest:

1. Open Chrome and go to https://app.mediwise.theyashgupta.me. Sign in.
2. Open the Chrome menu. Select "Add to Home screen", then "Install".
3. If MediWise was installed before the deploy, remove it and install it again. Chrome can keep the old manifest for up to one day.
4. Open WhatsApp. Open a chat that has a lab PDF. Touch and hold the PDF. Select the share icon, then MediWise.
5. Make sure that MediWise opens "Upload a report" with the PDF in the list.
6. Make sure that this line shows above the list: "We added 1 file from another app. Check the profile. Then select Read my report."
7. Make sure that no upload starts. Select the profile, then select "Read my report". The upload uses one credit.
8. Do steps 4 to 7 again with a JPG photo.
9. Sign out. Do step 4 again. Sign in. Make sure that the PDF is in the list after sign-in.

To see Cache Storage, connect the phone with USB and open `chrome://inspect` on the Mac. Select the MediWise page, then Application, Cache Storage. After step 5, `mediwise-share` has no entries.

## Install and offline on a phone

`sw.js` keeps the app shell of one build in the cache `mediwise-shell-<version>`: `/` and the content-hashed files in `/assets`. It never keeps an API response. The build writes the version and the file list at the top of `sw.js`, so each deploy that changes a file gives a new worker and a new cache. The new worker waits until the user selects "Update". Then it deletes the caches of earlier builds.

Do this test on an Android phone after each deploy that changes `sw.js`, the manifest or `index.html`:

1. In Chrome, open https://app.mediwise.theyashgupta.me and sign in. Close the tab.
2. Open the app again in a new tab. Make sure that Home shows the "Install MediWise" banner.
3. Select "Not now". Open Home again. Make sure that the banner does not show. It shows again after 30 days.
4. Install the app from the Chrome menu. Open it from the home screen. Make sure that it opens with no address bar and that the status bar has the colour of the app theme.
5. Turn on airplane mode. Close the app and open it again. Make sure that it shows "You are offline" and no report data.
6. Turn off airplane mode. Make sure that the page content comes back.
7. In Cache Storage (see the section above), make sure that `mediwise-shell-<version>` holds only `/`, `/assets/...`, `site.webmanifest`, `robots.txt` and `sitemap.xml`.
8. After the next deploy, open the installed app. Make sure that "Update available" shows. Select "Update". The app loads the new build.

On an iPhone, open the app in Safari on two different days. On the second visit, Home shows the hint sheet with the Share and Add to Home Screen steps one time only.

## Deploy a change

- Merge to `main` and push. Render builds and deploys `main` on its own.
- GitHub Actions deploys the web and the landing page when the push changes their files (next sections).
- Render waits for `/health` to answer 200 before it moves traffic to the new deploy. A failed health check keeps the old deploy live.
- On `SIGTERM` the API lets the job in hand finish, then exits.
- A wrangler deploy with `--branch` set to any name other than `main` is a preview. CORS blocks preview URLs, because `CORS_ORIGINS` names the production origins only.

## Deploy the web

`.github/workflows/deploy-web.yml` deploys the web on GitHub Actions:

- It starts on a push to `main` that changes `apps/web`, `packages` or `pnpm-lock.yaml`. To start it by hand, open Actions, `deploy-web`, Run workflow.
- It runs only on `theyashgupta/mediwise`. A fork does not deploy.
- The `check` job runs `.github/workflows/check.yml` first. The deploy starts only when `pnpm check` passes. A `workflow_run` trigger cannot filter by path, so the deploy calls the check workflow directly. Thus `check` runs twice on these pushes.
- It builds with `pnpm turbo run build --filter @mediwise/web` and the values from the table in Environment variables. Then `cloudflare/wrangler-action` uploads `apps/web/dist` to the project `mediwise`, branch `main`.
- A newer push cancels a deploy that is still running.
- The job summary shows the production URL and the URL of this deploy.
- The last step loads `https://app.mediwise.theyashgupta.me` and fails when the page has no `MediWise` title.

### Manual fallback

Use this when GitHub Actions is down. Run from the repository root of the main checkout, on an up-to-date `main`:

```sh
(cd apps/web && set -a && . ./.env.prod && set +a && VITE_API_URL=https://mediwise-api-ij2v.onrender.com VITE_APP_ORIGIN=https://app.mediwise.theyashgupta.me VITE_LANDING_URL=https://mediwise.theyashgupta.me pnpm build)
npx wrangler pages deploy apps/web/dist --project-name mediwise --branch main
```

The first line builds with the production variables. It sets `VITE_API_URL` on the command line, because an empty value in `.env.prod` makes the web call `http://localhost:3001`. It also sets the two public origins, because without them the OG tags and the manifest name `http://localhost:5173`. The second line uploads `apps/web/dist` as the production deploy of `https://app.mediwise.theyashgupta.me`. Wrangler prints a URL for the new deploy.

## Deploy the landing page

`.github/workflows/deploy-landing.yml` deploys the landing page with the same steps as the web. These are the differences:

- It starts on a push to `main` that changes `apps/landing`, `packages`, `pnpm-lock.yaml`, `apps/api/src/modules/payments/payments.config.ts` or the brand files in `apps/web/public` (favicons, `apple-touch-icon.png`, `og-image.png`).
- It uploads `apps/landing/out` to the project `mediwise-landing`, branch `main`.
- The last step loads `https://mediwise.theyashgupta.me` and fails when the page has no `MediWise` title.

### Manual fallback

The landing page is a static Next.js export. Run from the repository root of the main checkout, on an up-to-date `main`:

```sh
NEXT_PUBLIC_SITE_URL=https://mediwise.theyashgupta.me NEXT_PUBLIC_APP_URL=https://app.mediwise.theyashgupta.me \
  pnpm turbo run build --filter @mediwise/landing
npx wrangler pages deploy apps/landing/out --project-name mediwise-landing --branch main
```

- The first line builds `packages/engine` and `packages/shared` first, then writes the page to `apps/landing/out`. The build needs network access, because `next/font` downloads Inter, Instrument Serif and JetBrains Mono from Google Fonts.
- The build copies the favicons and `og-image.png` from `apps/web/public`. After the logo changes, run `node scripts/generate-brand-assets.mjs`, then build and deploy the landing page again.
- The prices come from `apps/api/src/modules/payments/payments.config.ts` and the counts come from the engine catalog when the page builds. After a change to either file, build and deploy the landing page again.
- The links to the app (Sign in, Read my report, the policy pages) point to `NEXT_PUBLIC_APP_URL`. Without the two variables, every link and the canonical URL name `localhost`.
- The project `mediwise-landing` exists. Do not create it again. A deploy with `--branch` set to any name other than `main` is a preview.

To check a build before you deploy it, serve `apps/landing/out` with a static server that compresses, such as `npx serve apps/landing/out`. Python's `http.server` does not compress, so Lighthouse scores it too low.

## Custom domains

The landing page is at `https://mediwise.theyashgupta.me`. The app is at `https://app.mediwise.theyashgupta.me`. The pages.dev addresses stay live as aliases. A sign-in on an alias returns to that alias, because the web sends `window.location.origin` as the redirect.

### Steps (orchestrator)

The orchestrator did steps 1 to 4 on 2026-10-13. Do them again only for a new domain.

1. DNS at GoDaddy, domain `theyashgupta.me`. Add two CNAME records:
   - `mediwise` to `mediwise-landing.pages.dev`
   - `app.mediwise` to `mediwise.pages.dev`
2. Cloudflare Pages. Add one custom domain to each project:
   - Project `mediwise-landing`: `mediwise.theyashgupta.me`
   - Project `mediwise`: `app.mediwise.theyashgupta.me`
   Wait until each domain shows Active.
3. Supabase, Authentication, URL Configuration, on both projects:
   - `mediwise-prod`: Site URL `https://app.mediwise.theyashgupta.me`. Redirect URLs `https://app.mediwise.theyashgupta.me/**` and `https://mediwise.pages.dev/**`.
   - `mediwise-dev`: keep Site URL `http://localhost:5173` and Redirect URL `http://localhost:5173/**`.
4. Google Cloud, Credentials, `mediwise-web`, Authorised JavaScript origins: add `https://app.mediwise.theyashgupta.me`. Keep `https://mediwise.pages.dev` and `http://localhost:5173`. The redirect URIs do not change, because Google returns to Supabase.
5. Render, `mediwise-api`, Environment: set `CORS_ORIGINS` to `https://app.mediwise.theyashgupta.me,https://mediwise.pages.dev`. Do this after the merge of MEDI-50. Until then the API reads `WEB_ORIGIN`.
6. Run the smoke test with `WEB_URL=https://app.mediwise.theyashgupta.me`. Every line must say `PASS`.

### Values for each deploy

| App | Variable | Value |
|---|---|---|
| API (Render) | `CORS_ORIGINS` | `https://app.mediwise.theyashgupta.me,https://mediwise.pages.dev` |
| Web (`deploy-web.yml`) | `VITE_APP_ORIGIN` | `https://app.mediwise.theyashgupta.me` |
| Web (`deploy-web.yml`) | `VITE_LANDING_URL` | `https://mediwise.theyashgupta.me` |
| Landing (`deploy-landing.yml`) | `NEXT_PUBLIC_SITE_URL` | `https://mediwise.theyashgupta.me` |
| Landing (`deploy-landing.yml`) | `NEXT_PUBLIC_APP_URL` | `https://app.mediwise.theyashgupta.me` |

- `VITE_APP_ORIGIN` goes into the OG and Twitter tags, `site.webmanifest` (`start_url`, `scope`), `robots.txt` and `sitemap.xml` of the app. Default `http://localhost:5173`.
- `VITE_LANDING_URL` is the "About MediWise" link in the app footer, also on the sign-in page. Default `http://localhost:3000`.
- `NEXT_PUBLIC_SITE_URL` goes into the canonical link, the OG tags, `sitemap.xml` and `robots.txt` of the landing page. Default `http://localhost:3000`.
- `NEXT_PUBLIC_APP_URL` is the target of every sign-in, sign-up and policy link on the landing page. Default `http://localhost:5173`.

### Check

1. Open `https://mediwise.theyashgupta.me/robots.txt` and `/sitemap.xml`. Each URL starts with `https://mediwise.theyashgupta.me`.
2. Open `https://app.mediwise.theyashgupta.me/site.webmanifest`. `start_url` and `scope` are `https://app.mediwise.theyashgupta.me/`.
3. Check CORS:

   ```sh
   curl -sI -H "Origin: https://app.mediwise.theyashgupta.me" https://mediwise-api-ij2v.onrender.com/health | grep -i access-control-allow-origin
   ```

   The answer names the origin. An origin outside the list gets no `Access-Control-Allow-Origin` header.

## Database migrations

Migrations are SQL files in `apps/api/src/db/migrations`, applied by Drizzle. `0000` to `0006` are applied on `mediwise-prod` (2026-10-12).

1. Apply a new migration to `mediwise-dev` first: `pnpm --filter @mediwise/api db:migrate`.
2. Apply it to production before you merge code that needs it. Use a connection string of a role that owns the tables. A shell value wins over `apps/api/.env`:

   ```sh
   cd apps/api
   (set -a; . ./.env.prod; set +a; pnpm db:migrate)
   ```

3. Read the migration SQL before you apply it. If it drops or renames a column, stop and ask the maintainer.

### Report titles (MEDI-80)

Do these steps in this order on `mediwise-prod`:

1. Apply migration `0023_report_titles` before you deploy the API. It adds `reports.title`, `reports.title_edited`, `report_files.lab_name` and `report_markers.report_file_id`. It drops nothing.
2. Deploy the API and the web.
3. Set the titles of the existing reports:

   ```sh
   cd apps/api
   (set -a; . ./.env.prod; set +a; pnpm db:backfill-titles)
   ```

4. Make sure that the log line gives the number of done reports.

A report read before MEDI-80 has no lab for each file. Its markers show the lab of the report, and its studies show no lab. To get the lab of each file and study, read the report again with `pnpm db:reread-reports --keep-classes`. That costs one read for each report.

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
| `pnpm db:backfill-titles` | Sets the title of every `done` report from the title rule: the dates, then the blood panel and the study types. It does not change a title that the user wrote. It makes no Claude call. |
| `pnpm db:claim-dev-data <user-id>` | Moves every profile of `DEV_USER_ID` to a Supabase user. Dev only. |

## Logs

- API: Render, `mediwise-api`, Logs. Every request log line starts with `[<request id>]`. The API returns the same id in the `X-Request-Id` response header, so a user report can be matched to its log lines.
- Worker lines start with `worker job=<id>` or `process_report report=<id>`.
- Web and landing page: the build and deploy logs are in GitHub, Actions, `deploy-web` or `deploy-landing`. Cloudflare has no build or runtime logs, because the pages are static. `npx wrangler pages deployment list --project-name mediwise` lists the deploys.

## Production limits in the API

- Security headers on every response (`hono/secure-headers`).
- Request body limit of 100 KB. Files go to Supabase Storage through signed URLs, so the API receives JSON only.
- `POST /reports`: 10 per hour per user. The 11th answers 429 with `Retry-After`.
- CORS allows the origins in `CORS_ORIGINS` only.

## Report credits

Each read uses one credit. A new account has 0 credits. To give credits, run this from a checkout with the production `apps/api/.env`:

1. `pnpm --filter @mediwise/api credits:grant <email> <n> <reason>`. Example: `credits:grant asha@example.com 5 beta tester`.
2. Read the log line. It shows the user id and the number of credits.

To see this month's Claude spend, call `GET /admin/spend` with the access token of the `ADMIN_USER_ID` account. The response also has `purchases` (orders paid this month) and `revenuePaise` (their amounts in paise, before refunds).

## Operator page

Sign in as the `ADMIN_USER_ID` account and open `/admin`. The link is not in the navigation. Every other account gets the not found page, and `GET /admin/overview` answers 404.

- The page shows Claude spend today, this week and this month against `CLAUDE_MONTHLY_CAP_CENTS`, reads per day for 30 days with the mean cost per read, the queue, credits granted and spent, and profiles and users.
- Days are UTC. A week starts on Monday. "Active" means a report added in the last 30 days.
- Failed reads show the date, the start of the report id and an error class. They show no title, lab, profile name or error text.
- "Re-read" calls `POST /admin/reports/:id/retry`. The report goes to the queue again and uses one credit of its owner, the same as the owner's own retry.
- Two alerts show on the page: spend at 80% of the monthly cap or more, and a job that waits more than 30 minutes. The worker checks them every 15 minutes and writes `alert kind=spend ...` or `alert kind=queue ...` as a warning in the log. No email is sent.

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
7. Web flag. In GitHub, Settings, Secrets and variables, Actions, Variables, set `VITE_PAYMENTS_ENABLED` to `true` and `VITE_CASHFREE_MODE` to `production`. Run the deploy again: Actions, `deploy-web`, Run workflow.
8. Check. Sign in on `https://app.mediwise.theyashgupta.me/credits`. Buy the 1-credit pack with a real payment. Make sure that the balance increases by 1. Refund the payment in the Cashfree dashboard. Make sure that the balance decreases by 1. Call `GET /admin/spend` and make sure that `purchases` is 1.

To turn off payments, set both flags to `false`. A payment that arrives while the API flag is `false` gets a 404. Cashfree retries it 3 times in about 45 minutes and then stops. Give those credits with `credits:grant`.

A refund: refund the payment in the Cashfree dashboard. The refund webhook removes the refunded credits from the balance. A partial refund removes its share of the pack, rounded.
