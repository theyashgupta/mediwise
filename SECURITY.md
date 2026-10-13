# Security Policy

MediWise stores lab reports, which are health data. A bug that shows one person's report to another person is the worst bug this project can have. Please report it in private.

## What counts

In scope:

- Access to a report, profile, file or trend of another account.
- A way past sign-in, or an access token that the API accepts when it should not.
- A path around the row level security on the Supabase tables, or around the private `reports` storage bucket.
- Report content, such as text in an uploaded PDF, that makes the API or Claude leak data or act outside the report.
- A secret, key or real personal data in the repository or its history.
- A way to spend another account's report credits, or to read reports with no credit.

Out of scope:

- Findings that need a stolen device, a stolen session or a compromised Supabase project.
- Missing headers or best-practice notes with no way to use them.
- The medical content. It is for information only. Use an issue for a wrong range or a wrong explanation.

## Report a vulnerability

**Do not open a public issue.**

Use GitHub private vulnerability reporting: [**Report a vulnerability**](https://github.com/theyashgupta/mediwise/security/advisories/new).

If you cannot use GitHub, send an email to **yashguptaab66@gmail.com** with "MediWise security" in the subject.

Include:

- The problem and the data or account boundary it crosses.
- The steps to reproduce it. Use your own test accounts and the sample reports in `apps/api/fixtures/golden`. Never use real health data.
- The commit SHA (`git rev-parse --short HEAD`) or the URL you tested.

## What happens next

You get a reply within a few days. One person maintains MediWise, so fixes are best effort. Security reports go first, and the aim is a fix within 90 days. The advisory credits you when the fix ships, unless you want to stay anonymous.

There is no bug bounty. MediWise cannot pay for reports.

## Supported versions

Only the latest `main` gets fixes. Check an issue against `main` before you report it.
