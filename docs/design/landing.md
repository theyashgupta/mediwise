# Landing page design (MEDI-168)

The landing page tells one story: a lab report becomes a plain-language explanation. Each section has its own layout, so no two sections look the same. Research: `docs/research/landing-motion.md`.

## Section map

| # | Section | Layout | Motion |
|---|---|---|---|
| 1 | Hero | Text left, phone right. Callout band below. | Three colour blobs drift behind the content (24, 32 and 38 s loops). A marker trend line draws itself once above the callout band. |
| 2 | Story (How it works) | Six step rows. From 1024 px each row is two columns, text and a 300 px phone, with the text centred on the phone and the sides alternating (text left on odd rows). Below 1024 px each row stacks: number, title, body, then a 260 px phone. 96 px between rows on a desktop, 64 px on a phone. | Reveal on each row. |
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
- There is no scroll or resize listener on the page, and no section pins.
- The hero blobs pause when the hero leaves the window, when the tab is hidden, with the Pause motion button and with reduced motion. The hero phone, heading and paragraph never animate, because they hold the LCP element.
- `will-change` is on the hero blobs only. The story section has `content-visibility: auto` with an intrinsic size of 5200 px below 1024 px and 4550 px from 1024 px. Measured (MEDI-184): 4984 to 5384 px at 320 and 390 px, and 4528 to 4554 px at 1280 px, both languages.

## Why the story no longer pins (MEDI-184)

MEDI-168 pinned the phone beside tall steps and switched its screen with the step at the centre of the window. The owner removed the pin on 2026-11-12 for two reasons:

- Empty space on tall windows. At 2000x1300 in dark mode, the header was followed by about 500 px of nothing, then the pinned phone low on the left with no step text in view. The half-window spacers that kept the phone pinned grow with the window height.
- The scroll feel. The owner does not like the pinned scroll behaviour of the section.

Each step is now a plain row with its own screen. There is no `position: sticky`, no `data-step` switching and no step observer. The first screen loads at once and the other five load lazily. Every row uses the same reveal as the other sections.

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

## Browser checks

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
