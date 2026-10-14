# Privacy notes

This file records what MediWise does with the data of family members and children, and what still needs a decision. MediWise is built to follow the DPDP Act 2023 and its rules. This file gives no legal advice. Source: `docs/research/features-2026-10.md`, Open items outside the ranking.

## What the app does

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
- In the review month (`ASSISTANT_REVIEW=true`), an account asks only after it agrees to the review on the Ask page. `assistant_consents` keeps the user id and the time it agreed.
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
3. **An account owner under 18.** The terms ask for an age of 18 or more, but sign-up does not ask for an age. The self profile shows no guardian line. Decide whether sign-up asks for an age.
4. **A child who turns 18.** The guardian record stays on the profile. Decide whether the app asks the owner to confirm the person's own permission at 18.
5. **Unconfirmed profiles.** A profile without a permission time can still get new reports. Decide whether uploads stop until the owner confirms.
6. **How long the deletion log stays.** The minimum is one year and the app keeps rows with no end date. Decide on a maximum and add a job that deletes older rows.
7. **The hash in the deletion log.** A plain SHA-256 lets anyone with a user id find that user's row. Decide whether a keyed hash (a new secret) is needed.
8. **Removing one family profile.** Only account deletion writes a log row. Decide whether removing one profile also writes a row.
