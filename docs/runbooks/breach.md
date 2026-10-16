# Breach runbook

Use this runbook when personal data in MediWise may have gone to a person or a system without permission. Personal data includes report files, report values, profiles, notes, questions, answers, email addresses and payment records.

Do the six parts in sequence: detect, contain, assess, notify, record, review. The notice clocks start at the time that you become aware of the breach. Write down that time first.

This runbook gives no legal advice. Before you send a notice to an authority, get a legal review if time permits. Do not let the review stop a deadline.

## Rules for every step

- Never print a secret in a terminal, a log, a chat or a ticket. Copy a new key to the clipboard with `pbcopy`, and paste it into the dashboard field.
- Never read an `.env` file to get a value. Use the dashboard of the provider.
- Never put the breach record in this repository. The repository is public.
- Keep evidence. Do not delete a log, a row or a file that shows the breach until the review is complete.

## 1. Detect

A breach can show in these places. Check each place when you get a signal.

| Signal | Where to look |
|---|---|
| A security report | GitHub, `theyashgupta/mediwise`, Security, Advisories. The email inbox of the contact address in `SECURITY.md`. |
| An error or a request pattern that you do not expect | Render, `mediwise-api`, Logs. Each line starts with the request id. |
| Database or storage access that you do not expect | Supabase, `mediwise-prod`, Logs, Logs Explorer. Select the Postgres, API Gateway and Storage sources. |
| A Claude spend that you do not expect | Anthropic Console, Usage. The MediWise operator page, `/admin`. |
| A payment event that you do not expect | Cashfree Merchant Dashboard, Transactions. |
| A secret in a commit | GitHub, `theyashgupta/mediwise`, Security, Secret scanning alerts. |

1. Write down the time that you became aware of the breach, in UTC. This time starts the 72-hour clock.
2. Write down the signal and its source.
3. If the signal shows that personal data may have gone out, go to part 2 immediately.

## 2. Contain

Stop the access first. Then rotate each secret that the breach may have exposed. If you do not know which secret leaked, rotate all of them.

### 2.1 Stop new uploads and reads

1. Open Render, `mediwise-api`, Environment.
2. Set `CLAUDE_HARD_STOP` to `true`. The API then refuses each new upload with a 503.
3. If the job worker is part of the breach, set `RUN_WORKER` to `false`.
4. Click Save, rebuild, and deploy.

### 2.2 Rotate SUPABASE_SERVICE_ROLE_KEY

This key gives full access to the database and the storage bucket.

1. Open Supabase, `mediwise-prod`, Project Settings, API Keys.
2. If the project uses the new secret keys: create a new secret key. Copy it with the copy button.
3. If the project uses the legacy `service_role` key: open Project Settings, JWT Keys, and rotate the JWT secret. This also changes the anon key and signs out every user.
4. Open Render, `mediwise-api`, Environment. Paste the new key into `SUPABASE_SERVICE_ROLE_KEY`. Click Save, rebuild, and deploy.
5. If the anon key changed: open GitHub, `theyashgupta/mediwise`, Settings, Secrets and variables, Actions. Update `VITE_SUPABASE_ANON_KEY`. Run the `deploy-web` workflow.
6. Make sure that `curl https://mediwise-api-ij2v.onrender.com/health` returns status 200.
7. Delete the old secret key in Project Settings, API Keys.

### 2.3 Rotate DATABASE_URL

`DATABASE_URL` holds the password of the `mediwise_app` role.

1. Run `openssl rand -hex 32 | pbcopy`. The command copies a new password and prints nothing.
2. Open Supabase, `mediwise-prod`, SQL Editor.
3. Run `alter role mediwise_app with password '<paste>';`.
4. Delete that query from the SQL Editor, so the password does not stay in a saved snippet.
5. Open Supabase, `mediwise-prod`, Connect, Transaction pooler. Copy the URI for `mediwise_app` and put the new password in it.
6. Open Render, `mediwise-api`, Environment. Paste the URI into `DATABASE_URL`. Click Save, rebuild, and deploy.
7. If the `postgres` password may have leaked: open Project Settings, Database, and click Reset database password.

### 2.4 Rotate ANTHROPIC_API_KEY

1. Open the Anthropic Console, Settings, API Keys.
2. Create a new key. Copy it with the copy button.
3. Open Render, `mediwise-api`, Environment. Paste the key into `ANTHROPIC_API_KEY`. Click Save, rebuild, and deploy.
4. In the Anthropic Console, disable the old key.

Do not change `ANTHROPIC_USER_SALT`. A new value gives each user a new id at Anthropic, and it does not stop an attack.

### 2.5 Rotate the Cashfree keys

1. Open the Cashfree Merchant Dashboard, Developers, API Keys.
2. Generate a new secret key. Copy it with the copy button.
3. Open Render, `mediwise-api`, Environment. Paste the key into `CASHFREE_SECRET_KEY`. If the app id changed, update `CASHFREE_APP_ID`.
4. Click Save, rebuild, and deploy. The webhook signature check uses the new key from this time.
5. Make sure that the old key no longer shows in the Cashfree dashboard.

### 2.6 Rotate the data key, if present

Do this step only when Render, `mediwise-api`, Environment, has `DATA_KEY_V1` or a later version.

1. Do the data key rotation steps in `docs/DEPLOY.md`.
2. Keep the old key until those steps tell you to remove it. A removed key makes its encrypted rows unreadable.

### 2.7 Close other access

1. If a user session may have leaked: open Supabase, `mediwise-prod`, Project Settings, JWT Keys. Rotate the signing key. This signs out every user.
2. If a share link may have leaked: delete the `report_shares` rows of the affected reports.
3. If a GitHub token or a Cloudflare token may have leaked: revoke it in the settings of that provider.
4. When the access stopped, set `CLAUDE_HARD_STOP` and `RUN_WORKER` back to their values before the breach.

## 3. Assess

Find which data, which users and which time window. Save the logs first, because the providers delete them.

### 3.1 Save the logs

1. Open Supabase, `mediwise-prod`, Logs, Logs Explorer. Export the Postgres, API Gateway, Auth and Storage logs for the window. The Free plan keeps logs for 1 day. The Pro plan keeps logs for 7 days.
2. Open Render, `mediwise-api`, Logs. Copy the lines for the window.
3. Keep the files in the private breach record (part 5), not in this repository.

### 3.2 Find the window

1. Find the first log line of the access that you do not expect. Write down its time in UTC.
2. Write down the time of the last rotation in part 2. The window ends at that time.

### 3.3 Find the tables and the files

These tables hold health data or personal data: `profiles`, `reports`, `report_files`, `report_markers`, `studies`, `study_measurements`, `findings`, `follow_ups`, `episodes`, `report_links`, `report_shares`, `assistant_questions`, `consent_records`, `payment_orders`, `credits_ledger`, `jobs`. The storage bucket `reports` holds the report files.

1. In the logs, find each table and each storage path that the access read or changed.
2. A storage path starts with the user id: `<user id>/<report id>/<index>.<ext>`.
3. If the leaked secret gives full access (`SUPABASE_SERVICE_ROLE_KEY`, the `postgres` password, `DATABASE_URL`), and the logs do not show the reads, assume that all tables and all files leaked.

### 3.4 Find the users

1. Open Supabase, `mediwise-prod`, SQL Editor.
2. For a set of report ids, run:

   ```sql
   select distinct p.owner_user_id
   from reports r join profiles p on p.id = r.profile_id
   where r.id = any('{<report id>,<report id>}'::uuid[]);
   ```

3. For a set of user ids, get the email addresses: `select id, email from auth.users where id = any('{<user id>}'::uuid[]);`.
4. Write down the number of users per country of residence, if known. Count the US users. The FTC deadline depends on that number.
5. Write down the number of family profiles in the set. The account owner gets the notice for each family profile.

## 4. Notify

Send each notice before its deadline. Count each deadline from the time in part 1, step 1.

| To | When | Where |
|---|---|---|
| Data Protection Board of India | First notice without delay. Detailed report within 72 hours. | The breach intimation form on the Data Protection Board of India website. |
| Affected users | Without delay. | Email from the contact address. |
| EU authority | Within 72 hours, unless the breach is unlikely to cause a risk to the users. | The data protection authority of each EU country where affected users live. |
| UK authority | Within 72 hours, unless the breach is unlikely to cause a risk to the users. | ICO, "Report a breach" form at ico.org.uk. |
| FTC, 500 or more US users | At the same time as the user notice. No later than 60 calendar days after discovery. | The Health Breach Notification Rule form at ftc.gov. |
| FTC, fewer than 500 US users | No later than 60 calendar days after the end of the calendar year. | The same FTC form. |

### 4.1 Users

1. Write one email. Say what happened, which data, which window, what MediWise did, what the user can do, and the contact address.
2. Send it from the contact address in `apps/web/src/modules/payments/config/policies.ts`.
3. Put the addresses in Bcc. Never put the addresses of other users in To or Cc.
4. Write down the time that you sent each email.

### 4.2 Data Protection Board of India

1. Send the first notice without delay. Give the nature, the extent, the time and the possible effect of the breach.
2. Send the detailed report within 72 hours. Add the cause, the actions in part 2, and the user notice.
3. If you need more than 72 hours, ask the Board for more time in writing before the deadline.

### 4.3 EU and UK authorities

1. List the EU countries of the affected users. MediWise has no EU establishment, so notify the authority of each country.
2. Notify the ICO for UK users.
3. If you do not have all facts at 72 hours, send the facts that you have. Send the remainder later.
4. If the risk to the users is high, also send the user notice in 4.1 without undue delay.

### 4.4 FTC Health Breach Notification Rule

1. Count the affected US users.
2. If the count is 500 or more: send the FTC form at the same time as the user notice. Do not wait more than 60 calendar days after discovery.
3. If 500 or more users live in one US state: also give notice to prominent media in that state.
4. If the count is less than 500: add the breach to the yearly log. Send the log to the FTC within 60 days after the end of the calendar year.
5. Do not use the 10 business day deadline. The rule amended on 29 July 2024 replaced it.

## 5. Record

Keep one record for each breach, in a private place outside this repository.

1. Write down the time of awareness, the window, the signal and its source.
2. Write down each action in part 2, with its time.
3. Write down the tables, the files and the number of users in part 3.
4. Write down each notice in part 4, with its time and its recipient.
5. Attach the saved logs from part 3.1.
6. Keep the record when no notice was necessary. Write down why no notice was necessary.

## 6. Review

Do the review within 14 days after the access stopped.

1. Find the cause of the breach.
2. Add a test, a check or a monitor that finds the same cause.
3. Make sure that each rotated secret works and each old secret no longer works.
4. Update this runbook with each step that was missing or wrong.
5. Remove the evidence only after the review is complete and the record holds it.
