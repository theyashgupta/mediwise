# Privacy notes

This file records what MediWise does with consent, with the data of family members and children, and what still needs a decision. MediWise is built to follow the DPDP Act 2023 and its rules, GDPR Article 9 for users in the EU and the UK, and the Washington My Health My Data Act. This file gives no legal advice. Source: `docs/research/features-2026-10.md`, Open items outside the ranking.

## What the app does

### Consent records (MEDI-165)

- Sign-up shows two separate boxes. Both are clear at the start, and the form does not submit until both are ticked.
  - `terms`: "I am 18 or older and I accept the Terms".
  - `health_data`: "I agree MediWise stores my health reports and uses an AI service to read them, as the Privacy policy describes." This is the explicit health data consent.
- The `health_data` box names no vendor and no country on purpose (MEDI-172). Only the privacy policy names the vendor. A provider change needs a policy edit and a new policy version, not a checkbox change.
- Each consent is one row in `consent_records`: user id, kind, policy version, accepted time, withdrawn time, and the SHA-256 of the browser user agent. Row level security is on, with no policies.
- The third kind, `assistant_review`, is the review-month consent of the Ask page. Migration 0029 moved the rows of the old `assistant_consents` table here and dropped that table.
- The API sets the policy version (`policyVersion` in `packages/shared`). The client sends only the kinds, so no row has a version that the API did not set. A database check refuses an empty version.
- An email sign-up stores `consent_version` in the Supabase user metadata. The first visit to the upload page turns it into the two rows, with no second prompt. The accepted time is the time of that visit.
- A Google or magic-link user has no metadata. The upload page shows the same two boxes before the first upload.
- `POST /reports`, `POST /reports/:id/uploaded` and `POST /reports/:id/retry` answer 403 with `missingConsent: "health_data"` when the user has no health data consent for the current version. The admin retry goes through the same check for the report owner.
- The JSON data download has every consent row. Account deletion deletes the rows, and the deletion log keeps their count (`consents`).
- The second box has 20 words, the limit of the copy rule.
- Withdrawal is account deletion. No code sets `withdrawn_at` yet. A row with a withdrawn time does not count.

### Policy version rule

- The policy version is the date of the last change to the privacy policy or the Terms, in the form `YYYY-MM-DD`.
- Change the date on every policy change. The policy pages show it at the top.
- When the version changes, only the `health_data` consent is asked again, before the next upload. A `terms` or `assistant_review` row counts for every later version.
- The policy text stays in English. Legal text needs a legal review before a translation (`docs/i18n.md`).

### Family member permission

- The profile form shows a required checkbox for every family profile: "I have this person's permission to add their reports".
- The API refuses a new family profile without the tick (`POST /profiles` answers 400).
- The API stores the time of the first tick in `profiles.permission_confirmed_at`. A later tick keeps the first time.
- Profiles made before MEDI-61 have no time. Home shows one prompt for them until the owner confirms. The prompt links to the Profiles page, where the owner can remove a profile.
- The self profile needs no tick and stores no time.

### Child profiles

- When the date of birth gives an age under 18, the form shows a second required checkbox: "I am this child's parent or guardian".
- The API refuses a new child profile, or a new date of birth under 18, without that tick.
- The API stores the time in `profiles.guardian_confirmed_at`.
- The age is 18 from the day of the 18th birthday. `isMinor` in `packages/shared` holds the rule.
- A child profile made before MEDI-61 also shows in the Home prompt, with a guardian line.

### Deletion log

- Account deletion (`DELETE /me`) writes one row to `deletion_log` in the same transaction that deletes the profiles.
- The row has the SHA-256 of the user id, the time, the scope (`account`) and the counts of profiles, reports, files and assistant questions. Rows from before MEDI-75 have no question count.
- The row has no name, email address, date of birth or report value.
- Row level security is on, with no policies. Only the API role and the service role can read the table.
- The app never deletes a row, so each row stays for at least one year.
- The data download (`GET /me/export`) reads nothing from this table.

### Visit notes

- The owner can write one note per report, 1,000 characters or fewer, in `reports.note`. The note is free text and can hold health data.
- Claude never gets the note. The read job loads no note, and every prompt is built from engine output only. `process-report.job.test.ts` fails when a note reaches a Claude request.
- The note shows on the report page, the doctor export, the share-with-doctor page, the JSON data download and the CSV download (one `note` row per report).
- Account deletion and report deletion remove the note with its report row.

### Assistant questions

- A question to the assistant and its answer are health data. Each one is a row in `assistant_questions`, with row level security on and no policies.
- The prompt holds the stored values, studies, findings, links and episodes of one profile. It never holds a report note, an episode note or name, family history, the doctor who signed a study, the profile name, the date of birth, a file name or another profile. `assistant.service.db.test.ts` fails when one of these fields reaches a Claude request.
- The server log holds the question id, the outcome, the rule names, the tokens and the cost. It never holds the question, the answer, a marker key or a value.
- The JSON data download holds every question with its answer that the user did not clear.
- "Clear chat", profile deletion and account deletion remove the question text, the answer text and the refusal kind.
- The row stays with the user id, the model, the token counts, the cost, the charged flag and the time. Profile and account deletion also remove the profile from the row.
- These counts keep the question quota, the daily limit and the monthly Claude spend correct. The kept row holds no text.
- In the review month (`ASSISTANT_REVIEW=true`), an account asks only after it agrees to the review on the Ask page. `consent_records` keeps an `assistant_review` row with the time and the policy version.
- The maintainer reads a sample of questions and answers with `pnpm --filter @mediwise/api assistant:review`. The sample holds only questions asked after the account agreed. The command never shows a profile name or an email.
- Each verdict is a row in `assistant_reviews` with the question id, the verdict and the time. Account deletion removes the consent and keeps the verdict, which holds no text. The data download includes the consent.
- Questions go to Anthropic, the same as report text. MediWise is built to follow the DPDP Act 2023 and Rules 2025. This note gives no legal advice.

## Rule 10 timeline

Rule 10 covers the data of a child, which is a person under 18.

- If MeitY's shorter timeline is in force: **13 November 2026**.
- Else: **13 May 2027**.

The checkbox above is the first step. It does not verify who the parent or guardian is.

## Decisions still open

1. **Which timeline applies.** Check whether MeitY's shorter timeline is in force. That date sets the deadline for every item below.
2. **Verifiable consent for a child.** Today a parent or guardian confirms with a tick. Decide whether a tick is enough, or which check of the adult the app needs.
3. **An account owner under 18.** Since MEDI-165, sign-up asks the user to confirm an age of 18 or older. The app does not check the age. Decide whether a self-declared age is enough.
4. **A child who turns 18.** The guardian record stays on the profile. Decide whether the app asks the owner to confirm the person's own permission at 18.
5. **Unconfirmed profiles.** A profile without a permission time can still get new reports. Decide whether uploads stop until the owner confirms.
6. **How long the deletion log stays.** The minimum is one year and the app keeps rows with no end date. Decide on a maximum and add a job that deletes older rows.
7. **The hash in the deletion log.** A plain SHA-256 lets anyone with a user id find that user's row. Decide whether a keyed hash (a new secret) is needed.
8. **Removing one family profile.** Only account deletion writes a log row. Decide whether removing one profile also writes a row.
9. **EU and UK representatives.** GDPR Article 27 and the UK GDPR need a representative for a controller outside the EU and the UK. None is appointed. The policy names none.
10. **DPIA.** Health data processed at scale with an LLM needs a data protection impact assessment. None is written.
11. **SCCs with Anthropic and Render.** The policy says transfers use the standard contractual clauses. Sign the data processing agreements with the SCCs (and the UK Addendum) with Anthropic and Render, and add a transfer impact assessment for India.
12. **Zero data retention.** Ask Anthropic for zero data retention on the MediWise organisation. Today the default commercial retention applies.
13. **Other Claude calls without the health data consent.** Only a new report, its upload confirmation and a retry check the consent. The Ask page, the year in review and the episode summary still send stored values to Anthropic for an account with no consent record, for example an account made before MEDI-165. Decide whether these calls also need the consent and a gate on their pages.
