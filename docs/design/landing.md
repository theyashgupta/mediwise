# Landing page design (MEDI-168)

The landing page tells one story: a lab report becomes a plain-language explanation. Each section has its own layout, so no two sections look the same. Research: `docs/research/landing-motion.md`.

## Section map

| # | Section | Layout | Motion |
|---|---|---|---|
| 1 | Hero | Text left, phone right. Callout band below. | Three colour blobs drift behind the content (24, 32 and 38 s loops). A marker trend line draws itself once above the callout band. |
| 2 | Story (How it works) | One stepper (MEDI-187). From 1024 px, a 300 px phone on the left and the list of six steps on the right, centred on the phone. Each step shows "Step n", the title and one body line. Below 1024 px the 220 px phone sits above the list. | The steps advance on their own, one every 4.5 s, from step 6 back to step 1. On each advance the phone turns on the Y axis and shows the screen of the next step. A bar under the active step fills in 4.5 s. |
| 3 | Numbers | Full-width primary band, four large numbers. | The numbers count up once. |
| 4 | Comparison | Two columns: a printed lab PDF and MediWise. Rows align through subgrid. | Reveal. |
| 5 | Features (MEDI-186) | 8 illustrated vignettes, each with a 3 to 6 word title and one sentence. 4 columns from 1280 px, 2 from 768 px, 1 on a phone. | Each scene plays once on reveal and loops on mouse hover. |
| 6 | Marker marquee | Two rows of marker names that scroll sideways. | Marquee. |
| 7 | Trust | One narrow column, one row for each item with its icon. | Reveal on the heading. |
| 8 | Pricing | Three pack cards. | Staggered reveal. |
| 9 | FAQ | Heading left, accordion right. | Reveal on the heading. |
| 10 | Final call to action | One centred card. | Reveal. |

The order follows the argument: what MediWise is (hero), how it works (story), how much it knows (numbers), what it adds to a lab PDF (comparison), what else it does (features), how wide the catalog is (marquee), how it handles data (trust), what it costs (pricing), questions (FAQ), then the call to action.

## Story steps

| Step | Copy | Body line | Screen |
|---|---|---|---|
| 1 | Upload | Add your report as a PDF or as photos, up to 20 files. | upload |
| 2 | Your score, and what to move first | Fixed rules score each report and put the markers to work on first in order. | move-first |
| 3 | Understand | MediWise explains each marker in plain words and shows its range. | marker |
| 4 | What changed since your last visit | See which markers improved and which became worse since your last report. | findings |
| 5 | A line for your doctor | A scan line that names a nodule or a mass comes first. Ask your doctor about it. | alert |
| 6 | Track | See how each marker changes from one visit to the next. | trends |

The owner described five steps. The stepper keeps six, because each step has its own screen and a merge of two steps removes one screen (MEDI-187).

The questions, settled, episode and Hindi screens left the page (orchestrator decision, 2026-10-16). Their copy is in the features vignettes.

## Motion rules

- JavaScript moves nothing itself. `components/motion.tsx` sets data attributes and CSS animates transform and opacity (the trend line animates its dash offset).
- Every reveal element is visible by default. The observer hides only an element that starts below the window, and shows it again when it scrolls in. Without JavaScript, with motion paused and with reduced motion, every element is visible.
- There is no scroll or resize listener on the page, and no section pins.
- The hero blobs pause when the hero leaves the window, when the tab is hidden, with the Pause motion button and with reduced motion. The hero phone, heading and paragraph never animate, because they hold the LCP element.
- `will-change` is on the hero blobs only. The story section has `content-visibility: auto` with an intrinsic size of 1550 px below 1024 px and 1000 px from 1024 px. Measured (MEDI-187): 1420 to 1582 px at 320 and 390 px, 1330 to 1356 px at 1023 px, and 985 to 1011 px at 1280 and 1920 px, both languages.
- The story stepper (MEDI-187) is the one client component that changes state on a timer. `sections/story-stepper.tsx` sets `aria-current` on the active step and `data-turn` on the phone. CSS turns the phone edge-on in 350 ms, swaps the screen with a 350 ms opacity delay, then turns the phone back in 350 ms. Two copies of the keyframes (`turn-a`, `turn-b`) alternate, so each change starts the turn again.
- The stepper advances only while at least 25% of it is in the window. With the Pause motion button or reduced motion it does not advance, the phone does not turn, the screen changes with a cut and the progress bar is not shown. A click or a key press on a step still selects it. Without JavaScript, step 1 is active and all six steps are readable.
- A click, Enter or Space on a step selects it and starts the 4.5 s count again from that step.

## Feature vignettes (MEDI-186)

The owner found the text index of 13 items too much to read (2026-11-12) and asked for animation. He picked option B, a cartoon doctor, from three previews: the droplet mascot (A), the doctor (B) and abstract scenes (C). Previews: `medi-185-option-{a,b,c}-<width>-<theme>.png`. Research: `docs/research/landing-motion.md`, Feature vignettes.

| # | Vignette | Scene |
|---|---|---|
| 1 | Up to 20 files per report | Two sheets fly onto a report card. The doctor taps the card and a clip closes the stack. |
| 2 | ECG, ultrasound and X-ray reports | The doctor points at the printed lines under an ECG trace. The lines highlight one by one. The trace stays plain. |
| 3 | Profiles for your family | Four people pop into a row. Each gets a range bar with its own band. One more line names the Hindi setting. |
| 4 | A summary for your doctor | A page comes out of a printer and moves to the doctor's hand. |
| 5 | Questions for your doctor | Two question bubbles open and their lines draw. The doctor reads. |
| 6 | Repeat scans can settle a line | A link draws from the earlier report to the later one. The alert line of the earlier report fades. |
| 7 | One episode for one workup | Three report cards move into date order under one bracket. |
| 8 | Trends across visits | The optimal band opens and the trend line draws. The doctor's pen follows it. |

Cost per report left this section. Pricing shows it.

Rules for the doctor:

- A drawn figure only: dot eyes, a teal hair cap, no realistic face, no real person. The face and the hair use the same tokens in light and dark, so the figure does not change between themes.
- The doctor never stamps, approves or signs a report. MediWise does not have a doctor review reports, so a stamp or a check mark would add a claim.
- The doctor, the arm, a sheet and a person are drawn once in `VignetteDefs` and reused with `<use>`.

Motion:

- `components/vignettes.tsx` draws each scene as inline SVG. The base style of every part is its final frame.
- `[data-reveal="shown"]` starts the scene. Each `.vg-cue` part animates from the offsets in its custom properties through `vignette-in` or `vignette-swing`, and each `.vg-draw` path through `draw`. The keyframes move transform and opacity only.
- Without JavaScript, with motion paused and with reduced motion, each vignette shows its final frame.
- `loopVignettes` in `components/motion.tsx` plays a scene again when a mouse enters it, and again after each 900 ms rest while the mouse stays. It only rewinds the CSS animations. It does not run on a device that cannot hover.
- The vignette classes are not scoped under the section, because a selector with an ancestor does not match the copies inside a `<use>` element.

## Phone frame (MEDI-187)

The owner asked for a phone that looks like a real iPhone, black and silver, with a bezel round the screen (2026-11-12). `components/phone.tsx` and the `.phone` rules in `globals.css` draw it in CSS only: a silver titanium rim with a light gradient and an inner highlight, a black bezel, rounded screen corners, the Dynamic Island, the action and volume buttons on the left, the side button on the right, and a soft shadow. The frame is the same in light and dark. The hero and the story use the same component.

## Why the story stepper replaced the rows (MEDI-187)

The six alternating rows of MEDI-184 made the section about 4,550 px tall on a desktop. The owner asked for one section that shows all steps at once, with a phone on the left that turns to each screen. The section is now about 1,000 px tall on a desktop and fits in one 1920x1080 window with the list and the phone in view.

## Why the story no longer pins (MEDI-184)

MEDI-168 pinned the phone beside tall steps and switched its screen with the step at the centre of the window. The owner removed the pin on 2026-11-12 for two reasons:

- Empty space on tall windows. At 2000x1300 in dark mode, the header was followed by about 500 px of nothing, then the pinned phone low on the left with no step text in view. The half-window spacers that kept the phone pinned grow with the window height.
- The scroll feel. The owner does not like the pinned scroll behaviour of the section.

Each step is now a plain row with its own screen. There is no `position: sticky`, no `data-step` switching and no step observer. The first screen loads at once and the other five load lazily. Every row uses the same reveal as the other sections.

## Hero background concepts (MEDI-185)

The owner asked for a hero background that says doctor and lab, without a stethoscope as the main motif (2026-11-12). Three previews were built as throwaway code. Previews: `docs/design/screenshots/medi-185-hero-option-{a,b,c}-{1280,390}-{light,dark}.png`.

| Option | Scene | HTML cost, gzipped (en / hi) | JavaScript |
|---|---|---|---|
| A | A printed report draws in line by line, behind the phone. Three values lift off as marker chips, settle at the right and float. | +2,487 / +2,403 bytes | 0 bytes |
| B | Thin line glassware floats: a flask, a round flask, a tube rack, a pipette and drops, in the primary outline and the droplet fill. The liquid level rises and falls and its surface moves. | +2,559 / +2,488 bytes | 0 bytes |
| C | Two blurred report sheets behind the phone. A soft light band sweeps across the front sheet every 9 s. CSS gradients only. | +1,244 / +1,100 bytes | 0 bytes |

All three use inline SVG or CSS only and animate transform and opacity (A also draws its lines with the dash offset). Each one stops when the hero leaves the window, when the tab is hidden, with the Pause motion button and with reduced motion, and then shows its final frame. The LCP element is the hero phone image in all three, and it does not animate.

## Measurements (2026-10-16)

Lighthouse 13, mobile, simulated throttling. The static build was served with gzip, as Cloudflare Pages serves it. Five runs each, before and after taken in turn, median shown. Other work ran on the same Mac, so the numbers move with its load. Two sets were taken.

| Metric | Before (main, 396313c) | After (MEDI-168), final set | Before, earlier set | After, earlier set |
|---|---|---|---|---|
| Performance | 0.91 | 0.90 | 0.91 | 0.91 |
| LCP | 3,329 ms | 3,439 ms | 3,287 ms | 3,302 ms |
| TBT | 83 ms | 104 ms | 42 ms | 48 ms |
| CLS | 0.000 | 0.000 | 0.000 | 0.000 |
| Accessibility | 1.00 | 1.00 | 1.00 | 1.00 |

The LCP element on a phone is the hero paragraph in both builds. It does not animate. The gzipped HTML grew by 305 bytes (inlined CSS).

Bundle: the landing first load is 146,510 bytes gzipped, up 382 bytes from 146,128. The budget for this change was 4,000 bytes, and the hard limit in `scripts/bundle-size.mjs` is 150,000 bytes. `pnpm size` passes.

## Measurements (MEDI-184, 2026-11-12)

Lighthouse 13.6, mobile, simulated throttling, the static build served with gzip. Five runs each, before and after taken in turn, median shown. This set measured a lower LCP than the 2026-10-16 set on the same page, so compare before and after within one set only.

| Metric | Before (main, 0fb0838) | After (MEDI-184) |
|---|---|---|
| LCP | 978 ms | 974 ms |
| CLS | 0.000 | 0.000 |
| TBT | 235 ms | 389 ms |

TBT moved from 32 to 824 ms between runs of the same build, because other work ran on the same Mac. The page loads less JavaScript after the change.

Bundle: the landing first load is 147,539 bytes gzipped, down 908 bytes from 148,447. The step observer and the story component left the client bundle.

## Measurements (MEDI-186, 2026-11-12)

Lighthouse 13.6, mobile, simulated throttling, the static build served with gzip. Ten runs each, before and after taken in turn, median shown.

| Metric | Before (main, 029399e) | After (MEDI-186) |
|---|---|---|
| LCP | 972 ms (958 to 1006) | 996 ms (956 to 1109) |
| CLS (median) | 0.000 | 0.000 |
| Accessibility | 1.00 | 1.00 |

The new recorded mobile LCP is 996 ms. The cause is 5 kB of inline SVG for the vignettes. The orchestrator accepted the 24 ms on 2026-11-12, because the ranges overlap and the JavaScript budget is the gate.

The LCP element paints with the first paint in every run. The HTML is 5,037 bytes larger gzipped (46,160 to 51,197): 2,256 bytes of markup and CSS, and 2,730 bytes for the copy of the same tree that Next writes into the page payload. At the simulated 1.6 Mbps, 5 kB costs about 25 ms, which matches the 24 ms difference in the median. One after run had a CLS of 0.039 from a hero blob (`div.hero-blob`), not from the vignettes.

Bundle: the landing first load is 147,779 bytes gzipped, up 240 bytes from 147,539. Only `loopVignettes` is new JavaScript. The inline SVG is in the HTML, which the 150,000 byte limit in `scripts/bundle-size.mjs` does not count.

## Measurements (MEDI-187, 2026-11-12)

Bundle: the landing first load is 148,733 bytes gzipped, up 954 bytes from 147,779. The story stepper and the phone frame classes are the new JavaScript. The frame CSS is inlined in the HTML, which the 150,000 byte limit does not count. Lighthouse was not run for this change.

## Browser checks

- Story stepper (MEDI-187, Playwright Chromium, static build): the steps changed at 4.52, 9.03, 13.56, 18.08, 22.59 and 27.13 s, from step 6 back to step 1. A click on step 3 at 29.16 s selected it, and step 4 followed at 33.67 s. Halfway through a turn the phone transform is `rotateY` at about 88 degrees, and after the turn it is `none`. Scrolled to the top, the step did not change in 6 s. With Pause motion the step did not change in 6 s, a click still selected a step, the phone had no animation and only the selected screen showed. With reduced motion the step stayed at 1 after 6 s. Tab, then Enter or Space, selected a step. At 1280 and 1920 px every body line is one line in both languages. At 200% text size nothing in the section passes the window edge at 1280, 390 and 320 px.

- Vignettes (MEDI-186, Playwright Chromium): at 1280, 1920 and 390 px, light and dark, all 8 vignettes reveal and end on their final frame. A mouse on a vignette plays it again and loops it, and after the mouse leaves the scene stops on its final frame. On the Hindi page at 1280 px with reduced motion, no vignette animation runs, every scene shows its final frame and the page has no sideways scroll.

- Story (MEDI-184, Playwright Chromium): at 1024, 1280, 1920 and 2560 px, light and dark, every row is 611 px tall (the phone height), the text centre sits on the phone centre, the phone alternates right, left, right, and the rows are 96 px apart. At 390 and 1023 px the rows stack, 64 px apart. No element in the section is sticky. A scroll and a nav jump to How it works reveal each row as it enters the window.
- Reveals: no element is hidden at load inside the window. Every element is visible after it is centred, and nothing is hidden with motion paused, with reduced motion or without JavaScript. Chrome sends no observer entry for a section skipped by `content-visibility`, so after a pause and a jump to the bottom, story steps above the window keep their hidden state until they scroll back in, and then reveal.
- The nav links to How it works, Pricing and FAQ land on their headings in both languages, with no drift after 3 s.
- Comparison rows stay aligned at 1280, 1024, 768, 640, 639, 390 and 320 px in both languages.
- At 320 px the nav "Read my report" button is wider than the window (by 37 px in English, 22 px in Hindi). Main has the same overflow, and this change does not touch the nav.
- At 200% text size, every section this change restyled (hero, story, numbers, comparison, features, trust) fits at 1280, 390 and 320 px. The nav overflows from 390 px down, and the pricing cards and the FAQ overflow at 320 px, as they do on main (this change only adds a reveal attribute to pricing).
- Playwright WebKit does not move keyboard focus to links with Tab (the macOS default), so the tab order was checked in Chromium. In WebKit, four PageDown presses from a hash link moved the page 860 px against 3120 px in Chromium; the screen still matched the centred step.
- Real Safari was not automated (remote automation is off). Playwright WebKit stands in for it.

## Screenshots

`docs/design/screenshots/medi-168-<section>-<width>-<theme>.png` for hero, numbers, comparison, features and trust, at 1280 and 390 px, light and dark.

`docs/design/screenshots/medi-184-how-it-works-<width>-<theme>.png` for the story rows at 1280, 1920, 2560 and 390 px, light and dark. `medi-184-full-page-1920-dark.png` is the full page at 1920 px in dark mode, and `medi-184-how-it-works-2000x1300-dark-viewport.png` is the window from the owner's report.

`docs/design/screenshots/medi-187-how-it-works-<width>-<theme>.png` for the stepper at 390, 1280 and 1920 px, light and dark. `medi-187-how-it-works-1920x1300-<theme>-viewport.png` is a tall window. `medi-187-hero-<width>-<theme>.png` shows the new phone frame in the hero at 1280 and 390 px. `medi-187-auto-advance.webm` records 30 s of the auto-advance at 1280 px, then a click on step 5.

`docs/design/screenshots/medi-185-final-<width>-<theme>.png` for the features section at 1280, 1920 and 390 px, light and dark, each scene on its final frame.
