# Landing page design (MEDI-168)

The landing page tells one story: a lab report becomes a plain-language explanation. Each section has its own layout, so no two sections look the same. Research: `docs/research/landing-motion.md`.

## Section map

| # | Section | Layout | Motion |
|---|---|---|---|
| 1 | Hero | Text left, phone right. Callout band below. | Three colour blobs drift behind the content (24, 32 and 38 s loops). A marker trend line draws itself once above the callout band. |
| 2 | Story (How it works) | Desktop: sticky phone left, tall steps right, the mirror of the hero. Phone: text above the screen in each step. | The phone screen crossfades to the step at the centre of the window. |
| 3 | Numbers | Full-width primary band, four large numbers. | The numbers count up once. |
| 4 | Comparison | Two columns: a printed lab PDF and MediWise. Rows align through subgrid. | Reveal. |
| 5 | Features index | Text list in up to three columns, items split by hairline rules. No cards, no icons. | Staggered reveal. |
| 6 | Marker marquee | Two rows of marker names that scroll sideways. | Marquee. |
| 7 | Trust | One narrow column, one row for each item with its icon. | Reveal on the heading. |
| 8 | Pricing | Three pack cards. | Staggered reveal. |
| 9 | FAQ | Heading left, accordion right. | Reveal on the heading. |
| 10 | Final call to action | One centred card. | Reveal. |

The order follows the argument: what MediWise is (hero), how it works (story), how much it knows (numbers), what it adds to a lab PDF (comparison), what else it does (features), how wide the catalog is (marquee), how it handles data (trust), what it costs (pricing), questions (FAQ), then the call to action.

## Story steps

| Step | Copy | Screen |
|---|---|---|
| 01 | Upload | upload |
| 02 | Your score, and what to move first | move-first |
| 03 | Understand | marker |
| 04 | What changed since your last visit | findings |
| 05 | A line for your doctor | alert |
| 06 | Track | trends |

The questions, settled, episode and Hindi screens left the page (orchestrator decision, 2026-10-16). Their copy is in the features index.

## Motion rules

- JavaScript moves nothing itself. `components/motion.tsx` sets data attributes and CSS animates transform and opacity (the trend line animates its dash offset).
- Every reveal element is visible by default. The observer hides only an element that starts below the window, and shows it again when it scrolls in. Without JavaScript, with motion paused and with reduced motion, every element is visible.
- The story uses one IntersectionObserver with a thin band at the centre of the window. It writes `data-step` on the story, and CSS shows the matching screen. There is no scroll or resize listener on the page.
- The pinned layout applies only when the head script set `data-js`. Without JavaScript, each step shows its own screen.
- The hero blobs pause when the hero leaves the window, when the tab is hidden, with the Pause motion button and with reduced motion. The hero phone, heading and paragraph never animate, because they hold the LCP element.
- `will-change` is on the hero blobs only. The story section has `content-visibility: auto` with an intrinsic size of 5300 px on a phone and `550vh + 180px` on a desktop. Measured: 5040 to 5440 px on a phone (320 and 390 px, both languages), and 5116 to 5142 px at 1280x900 on a desktop.

## The story break before MEDI-168

Test: Playwright Chromium and WebKit, light and dark, with motion on, paused through the button, with OS reduced motion, and with the scroll-timeline rules deleted.

- The screen switch worked in all 16 combinations.
- The layout broke in all of them. The steps were 172 to 298 px tall and the phone 611 px, so the phone was pinned for about 20% of the story and cut off for about 70% of it. With step 1 at the centre, the bottom of the phone was below the fold. With step 4 at the centre, the top was under the nav.
- On windows under about 720 px tall, such as Safari with its toolbar on a laptop, the sticky offset put the top of the phone under the 56 px nav at all times.
- With the timeline rules on, the screen could differ from the step at the centre.

After MEDI-168 the steps are 75% of the window tall, the phone height has a cap of the window height minus 8 rem, and the step column has half a window of space at each end, so the phone is already pinned when the first step reaches the centre and stays pinned until the last step leaves it. With each step at the centre, the phone is fully inside the window and below the nav, and it shows that step's screen, at 1280x900, 1440x760 and 1024x700, in Chromium and WebKit, with motion on, paused and reduced.

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

## Browser checks

- Story: Chromium and WebKit (Playwright), 1280x900, 1440x760 and 1024x700, light and dark, with motion on, paused and reduced: 36 of 36 runs show the right screen for each centred step, with the phone inside the window and below the nav. Google Chrome 155 at 1280x900: 6 of 6 steps. A 40 px scroll sweep through the story found no sample with the phone cut off, no blank phone and no two screens at once. At 1023 px the steps stack; from 1024 px the phone pins.
- Reveals: no element is hidden at load inside the window. Every element is visible after it is centred, and nothing is hidden with motion paused, with reduced motion or without JavaScript. Chrome sends no observer entry for a section skipped by `content-visibility`, so after a pause and a jump to the bottom, story steps above the window keep their hidden state until they scroll back in, and then reveal.
- The nav links to How it works, Pricing and FAQ land on their headings in both languages, with no drift after 3 s.
- Comparison rows stay aligned at 1280, 1024, 768, 640, 639, 390 and 320 px in both languages.
- At 320 px the nav "Read my report" button is wider than the window (by 37 px in English, 22 px in Hindi). Main has the same overflow, and this change does not touch the nav.
- At 200% text size, every section this change restyled (hero, story, numbers, comparison, features, trust) fits at 1280, 390 and 320 px. The nav overflows from 390 px down, and the pricing cards and the FAQ overflow at 320 px, as they do on main (this change only adds a reveal attribute to pricing).
- Playwright WebKit does not move keyboard focus to links with Tab (the macOS default), so the tab order was checked in Chromium. In WebKit, four PageDown presses from a hash link moved the page 860 px against 3120 px in Chromium; the screen still matched the centred step.
- Real Safari was not automated (remote automation is off). Playwright WebKit stands in for it.
- Story section height, used for `contain-intrinsic-size`: 5040 to 5440 px on a phone (320 and 390 px, both languages) and 5116 to 5142 px at 1280x900.

## Screenshots

`docs/design/screenshots/medi-168-<section>-<width>-<theme>.png` for hero, story (step 4 at the centre), numbers, comparison, features and trust, at 1280 and 390 px, light and dark.
