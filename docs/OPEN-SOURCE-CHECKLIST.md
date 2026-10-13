# Open-source checklist

Result of each MEDI-48 check before the repository goes public. Checked on 2026-10-13 on branch `MEDI-48`.

## 1. Personal data out

- [x] **Golden fixtures.** The three real golden files moved to `~/Work/mediwise-samples/golden`, beside the private PDFs. The repo holds two made-up reports: `apps/api/fixtures/golden/sample-2024.pdf` and `sample-2025.pdf`, with their golden files.
- [x] **Made-up values stay in band.** Each value moved by 2 to 12 percent. A value moved only when the engine gave the same status. The sample read gives score 87 and maps 108 of 109 markers, the same as the real report. Dates moved by 8 weeks.
- [x] **Extraction eval.** `pnpm eval:extraction` shows "no differences" on both samples, at 0.48 cents per sample.
- [x] **Engine fixture.** `packages/engine/fixtures/findings.json` has made-up lab names, dates moved by 8 weeks and values moved with one factor per marker, so every trend keeps its direction.
- [x] **Tests and code.** No test or prompt contains a real patient, family member, doctor, lab, insurer, patient ID or city. The dev user is `dev-user`.
- [x] **Docs.** Docs name the maintainer by role. `docs/tickets/NOTES.md` has no family name and no health finding.
- [x] **Screenshots.** OCR (tesseract) of all 161 tracked images finds no real name, email, birth date, lab or hospital. Every screenshot that showed real data is now from the demo account, or is deleted when it showed old UI.
- [x] **Demo GIF.** The OCR of each frame of `docs/assets/demo.gif` finds no real name. Checked again after the MEDI-87 recording on 2026-10-13: 200 frames, only made-up names.
- [x] **Secrets, working tree.** `gitleaks dir` on the tracked files: no leaks. `.gitleaks.toml` allows only the made-up JWT secret in `apps/api/vitest.config.ts`.
- [x] **Secrets, history.** `gitleaks git` over all refs, 231 commits: no leaks.
- [ ] **Personal data, history.** 51 commits before MEDI-48 hold personal data. The data is real lab values with a name, a family member's scan results, a birth date, an email, and lab, hospital and doctor names. Two commit messages also hold a name. A history rewrite or a fresh public history must remove them. This needs a decision from the maintainer. The list is at the end of this file.

## 2. README

- [x] Centred hero with `docs/assets/banner.png` (from `scripts/generate-brand-assets.mjs`), a tagline and badges for CI, licence, Node and pull requests.
- [x] `docs/assets/demo.gif` (MEDI-87): an upload of the repeat scan in `apps/api/fixtures/episode` on the demo account, the auto-link, the Settled block, then the switch to Hindi. 20 seconds, 842 kB.
- [x] Sections: what it does, how a report becomes a score, stack, quick start, self-hosting, project structure, contributing, licence.
- [x] The text follows `.claude/rules/copy.md`: no sentence over 20 words, no semicolon, no em dash.
- [x] A local render shows the banner (1280 px) and the GIF (960 px). The CI badge shows only after the repository is public.

## 3. Licence

- [x] `LICENSE` is the AGPL-3.0 text from gnu.org (SHA-256 `0d96a4ff68ad6d4b6f1f30f713b18d5184912ba8dd389f86aa7710db079abcb0`).
- [x] Every `package.json` has `"license": "AGPL-3.0-only"`.

## 4. Community files

- [x] `CONTRIBUTING.md`: one worktree per change, `pnpm check`, conventional commits, signed commits, no real health data.
- [x] `CODE_OF_CONDUCT.md`: Contributor Covenant 3.0.
- [x] `SECURITY.md`: private report through GitHub or email, no bug bounty.
- [x] `SUPPORT.md`.
- [x] `.github/ISSUE_TEMPLATE`: bug form, feature form, security contact link.
- [x] `.github/PULL_REQUEST_TEMPLATE.md`.
- [x] `.github/dependabot.yml`: npm and GitHub Actions, weekly, 7-day cooldown on npm.
- [x] `.github/workflows/pr-title.yml`: conventional pull request titles.

## 5. Commit rules

- [x] `commitlint` with `@commitlint/config-conventional`, run by the husky `commit-msg` hook. `pnpm install` installs the hook.
- [x] The hook rejects `fixed stuff` (exit 1, `subject-empty`, `type-empty`) and accepts `feat: add the readme hero`.
- [x] Merge commits are exempt: `Merge MEDI-41: landing page in apps/landing` passes.
- [x] Body and footer lines have no length limit. The header limit is 100 characters.
- [x] `CONTRIBUTING.md` documents the signed-commit requirement and the SSH key setup.

## 6. Env examples

- [x] `apps/api/.env.example` lists every variable in `apps/api/src/config/env.ts`, each with a one-line comment and no value.
- [x] `apps/web/.env.example` lists every `VITE_` variable the web app reads.
- [x] `apps/landing/.env.example` states that the landing page reads no variable.
- [x] `.gitignore` covers `.env`, `.env.*` (with `.env.prod`) and `smoke.env`, and keeps `.env.example`.

## 7. Gate

- [x] `pnpm check`: 20 of 20 tasks pass after the merge of `main` (MEDI-47).

## Before the repository goes public (maintainer)

- [ ] Decide on the history (see section 1) and apply it.
- [ ] Turn on private vulnerability reporting (Settings, Code security).
- [ ] Add a branch rule on `main` that requires signed commits and the `check` and `pr-title` checks.
- [ ] Turn on Dependabot alerts.
- [ ] Rotate any key that was ever shared outside the env files.

## Commits with personal data

Names in commit messages are replaced with a role here.

- `9809464` 2026-10-13 Merge branch 'main' into MEDI-47
- `3c390b1` 2026-10-13 feat(design): design-tokens package, glass surfaces on the shell, report header and sign in (MEDI-47)
- `2bfe1f4` 2026-10-13 docs: MEDI-49 and MEDI-50 orchestrator state in NOTES
- `4cc6764` 2026-10-13 docs: feature research with a ranked top 10 and five ticket drafts (MEDI-43)
- `4bc91ef` 2026-10-13 docs: MEDI-50 domain override, theyashgupta.me
- `00cbcad` 2026-10-13 docs: navigation and layout widths sections with shell and width screenshots (MEDI-39)
- `5d8da95` 2026-10-13 Merge remote-tracking branch 'origin/main' into MEDI-42
- `f45fa1b` 2026-10-13 feat(auth): Google sign-in through Supabase PKCE with a callback route and readable errors (MEDI-42)
- `ee2a2b3` 2026-10-13 Merge branch 'main' into MEDI-40
- `fe8bfbb` 2026-10-13 docs(design): three logo mark candidates with size, tab and header renders (MEDI-40)
- `2766977` 2026-10-13 docs: MEDI-39 wide-screen layout override
- `db17d52` 2026-10-13 docs: handoff notes and ticket order for MEDI-39 to MEDI-41
- `aee2df3` 2026-10-12 docs: page patterns, after screenshots in both themes and on a phone, Lighthouse results (MEDI-35)
- `4bec0dd` 2026-10-12 feat(engine): sourced study alert table, alert finding ranked first with a doctor question and a headline sentence (MEDI-37)
- `d25f7bd` 2026-10-12 feat(api): pathology reports as studies with specimen, adequacy and result, study alerts kept when Claude fails (MEDI-37)
- `3c354db` 2026-10-12 docs: before screenshots of every page in both themes (MEDI-35)
- `b88b82f` 2026-10-12 Merge MEDI-34: design foundation, warm palette, fonts, vega primitives, themed shell
- `3c37752` 2026-10-12 docs: DESIGN.md with palette, type, elevation, library verdicts and before and after screenshots (MEDI-34)
- `b155e9c` 2026-10-12 feat(api): Cashfree credit packs behind PAYMENTS_ENABLED, idempotent webhook credit and refund, purchases in admin spend (MEDI-33)
- `c77bdae` 2026-10-12 docs: MEDI-33 switches to Cashfree first
- `1d6d63d` 2026-10-12 docs: design library candidates from [maintainer]
- `7ab50c9` 2026-10-12 docs: payments and design decisions from research, [family member] 2025 samples
- `41fee99` 2026-10-12 feat(api): findings table, Haiku finding bodies with validator and one retry, eval:findings (MEDI-29)
- `ac41272` 2026-10-12 feat(engine): findings from two visits, link patterns for scans, unit fixes for repeated and misprinted units (MEDI-29)
- `e78e6ba` 2026-10-12 docs: golden drift note from the MEDI-32 live run
- `fb66ed8` 2026-10-12 fix(api): keep doctor and package names out of the lab name
- `0e0e9dc` 2026-10-12 feat(api): narrative as a cited sentence list on Haiku, per-sentence retry, rejection reasons on job usage (MEDI-31)
- `a6aaa28` 2026-10-12 feat(api): text-first extraction, compact output, per-step models and cost, eval harness (MEDI-26)
- `3cd7f39` 2026-10-12 docs: drop zone override for MEDI-27 and the ticket order
- `d91cf83` 2026-10-12 docs: 2025 sample set and findings for MEDI-26 to MEDI-29
- `9508fac` 2026-10-12 docs: production URLs and deploy commands
- `d4ffe08` 2026-10-12 docs: zero-cost deploy decision, Cloudflare Pages and Render free replace Vercel and Railway
- `9e90a9e` 2026-10-12 docs: production Supabase project note for MEDI-16
- `7ad45bd` 2026-10-12 docs: MEDI-16 worker flag and backfill notes from the MEDI-17 handoff
- `cbe03bc` 2026-10-12 docs: web env file and auth URL note from MEDI-18
- `6905dce` 2026-10-12 feat(api): verify Supabase access tokens in the auth middleware, /me returns the email (MEDI-18)
- `8130311` 2026-10-12 docs: MEDI-16 prettierignore follow-up from the MEDI-22 handoff
- `0ad5ee6` 2026-10-12 docs: MEDI-17 and MEDI-16 follow-ups from the MEDI-20 handoff
- `a41b994` 2026-10-12 Merge MEDI-12: marker page API and web module
- `ea88a47` 2026-10-12 docs: MEDI-20 follow-up from the MEDI-12 handoff
- `8a4de3e` 2026-10-12 Merge MEDI-11: report page and final report detail shape
- `f5f1502` 2026-10-12 docs: MEDI-12 follow-ups from the MEDI-11 handoff
- `e5057ab` 2026-10-12 docs: MEDI-12 follow-ups from the MEDI-10 handoff
- `f87e362` 2026-10-12 docs: user-facing text follows ASD-STE100, add the asd-ste100 skill
- `ac34a16` 2026-10-12 docs: record MEDI-9 approved deviations and MEDI-19 pointer
- `8e04515` 2026-10-11 feat: settings page with name, self profile, theme, data export and account delete (MEDI-14)
- `2ad4b7e` 2026-10-11 docs: note RLS migration for MEDI-8
- `cd9fca0` 2026-10-11 docs: note where apps/api/.env lives for worktrees
- `d1c439b` 2026-10-11 feat: drizzle schema, storage helpers, dev auth middleware and /me (MEDI-3)
- `396c03e` 2026-10-11 docs: ticket notes that override Dispatch text
- `04840fd` 2026-10-11 docs: defer auth to MEDI-18, revise MEDI-3, add narrative decision
