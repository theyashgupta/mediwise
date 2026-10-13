# Share a report from WhatsApp into MediWise on Android

Goal: a user with MediWise installed on Android shares a lab PDF or photo from WhatsApp, or any app, to MediWise. The upload page opens with the files in the list. Rank 2 in `docs/research/features-2026-10.md`.

Scope:

1. Add `share_target` to `apps/web/public/site.webmanifest`: action `/share-target`, method `POST`, enctype `multipart/form-data`, one `files` param that accepts PDF, JPG, PNG and HEIC by MIME type and by extension.
2. Add a hand-written service worker, `apps/web/public/sw.js`. It handles only `POST /share-target`. It reads the files from the form data, keeps them in Cache Storage under one fixed key, and answers with a 303 redirect to `/reports/upload?shared=1`.
3. Register the worker from `src/app`. `main.tsx` only renders, per `.claude/rules/structure.md`.
4. On `/reports/upload?shared=1`, the upload container reads the shared files and adds them through `useSelectedFiles`. Then it deletes them from Cache Storage and removes `shared` from the URL. The existing limits and errors apply.
5. Show one line above the file list: "We added {n} files from another app. Check the profile. Then select Read my report."
6. A signed-out user signs in, then comes back to `/reports/upload?shared=1` with the files still there.

Rules:

- The worker must not answer any other request. It must never cache an API response, so no health data stays in the browser cache.
- Delete the shared files from Cache Storage after the upload page reads them, also when the user removes them from the list.
- The upload does not start by itself. The user confirms the profile and selects "Read my report". One upload uses one credit, as today.
- No new runtime dependency. No `vite-plugin-pwa`.
- Copy follows `.claude/rules/copy.md`.
- iOS Safari does not support share targets. Do not add an iOS path.

Acceptance:

- A Playwright check passes: with the worker active, a page posts a multipart form with a sample PDF to `/share-target`. The upload page opens with the PDF in the list, and Cache Storage no longer holds it.
- The same check passes for a signed-out user, after sign-in.
- A check shows that `/api` responses do not enter Cache Storage.
- `pnpm build` gives a `dist` with `sw.js` at the root, and `_redirects` does not shadow it.
- Write in the PR how the maintainer tests the share from WhatsApp on an Android phone after deploy.
- `pnpm check` passes.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
