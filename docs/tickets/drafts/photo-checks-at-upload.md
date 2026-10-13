# Photo checks at upload: warn about a small, dark or blurred photo

Goal: the user knows before the read that a photo may fail, and can take it again. Fewer reads fail. Rank 5 in `docs/research/features-2026-10.md`.

Scope:

1. Add a pure function in the reports module of the web app. Input: the width, the height and the grey pixels of a photo scaled to 512 px on the long side. Output: three flags, `small`, `dark` and `blurred`.
2. `small`: the short side of the original photo is under 1000 px. `dark`: the mean brightness is under 25% of white. `blurred`: the variance of a Laplacian filter is under a threshold. Set the blur threshold from page images of the sample PDFs (render them with `pdftoppm`, then blur and darken copies). Record the values in the PR.
3. When the user adds a JPG or PNG, draw it on a canvas and run the check. Skip PDF and HEIC files, because Chrome cannot draw HEIC.
4. Show one warning on the file row in `file-preview-list.tsx` for each flag, in this order:
   - "This photo is small. Take it again closer to the page."
   - "This photo is dark. Take it again in good light."
   - "This photo is blurred. Hold the phone still and take it again."
5. Add three tips under the drop zone text in `drop-zone.tsx`: "Use daylight or a bright room.", "Fit one full page in each photo.", "Hold the phone flat above the page."

Rules:

- A warning never blocks the upload. The user can still select "Read my report".
- The check runs in the browser only. The photo does not leave the device for the check. No Claude call.
- No new runtime dependency.
- A warning is a notice, not a result. Use `bg-muted` and the muted text token, not a status colour, per `docs/DESIGN.md`.
- Copy follows `.claude/rules/copy.md`.

Acceptance:

- Tests of the pure function pass: a sharp checkerboard gives no flag, a flat grey image gives `blurred`, a black image gives `dark`, an 800 x 600 photo gives `small`.
- On the upload page, a dark photo shows the dark warning, and the upload still starts.
- Add a light and a phone screenshot of the upload page with one warning to `docs/design/pages`, and update the Upload row in `docs/DESIGN.md`.
- `pnpm check` passes.

Read `docs/tickets/NOTES.md` before you start. It overrides this text and holds the env copy step.
