# Design v2 research: glass surfaces in health products

Date: 2026-10-13. Ticket: MEDI-47. The verdict is in [DESIGN.md, Design v2](../DESIGN.md#design-v2-tokens-and-glass).

Question: how do health products use layered or glass surfaces and still look medical? Which values do we use, and where do we stop?

## Method and limits

- We read the public pages, design case studies, brand guides and reviews of seven products. The sources are at the end.
- Our research tools read page text, not screenshots. For most products we could not confirm where the app uses blur. Those cells say **unverified**. We did not fill a gap with a guess.
- Platform guidance (Apple Liquid Glass, Microsoft Acrylic and Mica), browser support and WCAG text are from primary sources.

## Products

| Product | What makes it read as medical | Glass (verified) | Solid |
| - | - | - | - |
| Function Health | Each biomarker shows a reference range and an "optimal" band, not only "normal". Results carry a colour code. | Unverified. The marketing site shows no app screens. | Values, ranges, status (from a review). |
| Superpower | A results dashboard that explains each biomarker, grouped in 17 categories, with green, yellow and red status. | Unverified. | Values and status (from a review). |
| Apple Health (iOS 26) | System type, dense lists, one colour per health category, charts with a clear axis. | Tab bars and toolbars use Liquid Glass. Tab bars shrink when the page scrolls. | Content in lists and charts stays in the content layer. |
| Oura | Three tiers of data: rings, bars and colour cues on top, focused vitals in the middle, precise trends at the deepest level. A semantic colour system. | Unverified. | Unverified. |
| WHOOP | A separate numeric face (DIN Pro Bold) for numbers, Proxima Nova for words. Status colours for recovery only (high, medium, low with fixed thresholds). One accent for actions and good results. Very large primary number. | None in the brand guide. Mock cards are dark with a soft gradient and no blur. The bottom bar is unverified. | Cards and numbers. |
| ZOE | A 0 to 100 score in four named bands, with a traffic-light colour code. | Unverified. | Unverified. |
| Eight Sleep | Two main screens. The score comes first, with "in range" or "out of range", then its inputs directly below. Each metric has a benchmark and a status dot. | Unverified. An agency page shows dark dawn and sunset gradients, which can be a concept. | Scores and graphs. |

What the seven have in common (verified items only):

- **Status colour means state.** WHOOP, ZOE, Eight Sleep and Oura use status colour for a result, never for decoration.
- **Numbers get their own treatment.** WHOOP uses a separate numeric face. Every product gives the main number the largest size on the screen.
- **Progressive detail.** A summary first, then the inputs, then the history (Oura, WHOOP, Eight Sleep).
- **No blur on a value.** We found no source that shows a number, a result or a chart on a blurred surface.

What makes a SaaS dashboard look different, and what we avoid: many accent colours, gradients on data, a card grid with equal weight for every number, icons in coloured circles, and glass on every card.

## Platform guidance

Apple Liquid Glass (WWDC25, session 219):

- Glass is for **the navigation layer that floats above the content**. Lists, tables and other content stay in the content layer.
- **No glass on glass.** A control on a glass bar uses a fill, not a second glass layer.
- **Reduce Transparency** makes the glass frostier and hides more of the content behind it.

Microsoft Acrylic and Mica:

- Acrylic is "GPU-intensive". Do not layer acrylic, and do not put two acrylic panes edge to edge.
- Use a solid background for tall side panes.
- Do not put accent-coloured text on acrylic. At 14 px it will likely fail 4.5:1.
- Mica falls back to a solid colour when the user turns transparency off.

## Browser facts

| Feature | Status on 2026-10-13 | What we do |
| - | - | - |
| `backdrop-filter` | Baseline 2024, about 97% of users. Safari 18 ships it without the `-webkit-` prefix. | Use the unprefixed property inside `@supports`. Safari 17 and older get the solid surface. |
| `prefers-reduced-transparency` | Chrome and Edge 118+. Firefox 113 behind a flag. Not in Safari. | Use it as an extra signal, never as the only fallback. |
| Backdrop root | An ancestor with `opacity` below 1, `filter`, `mask`, `clip-path`, `mix-blend-mode` or `will-change` limits what the blur can see. | Keep these off the ancestors of a glass surface. |
| Cost | A blurred sticky header repaints its blur on every scroll frame. More layers cost more. No source gives a reliable number. | At most 3 glass layers in one view. Never animate the blur radius. Measure INP before and after. |

## Contrast on glass

- WCAG 1.4.3 measures contrast against "the background over which the text is rendered in normal usage". It has no rule for a translucent surface. Failure F83 covers text on a background image.
- Practice: measure against the **worst backdrop** that can sit under the surface. A calculator for translucent colours checks the composite over pure black and over pure white and keeps the lower ratio.
- No source publishes a minimum tint opacity. We derive one.

Our derivation, with the MediWise colours (composited in sRGB, blur ignored, so the numbers are a lower bound):

| Tint | Text | Lowest opacity for 4.5:1, light over black | Lowest opacity for 4.5:1, dark over white |
| - | - | - | - |
| card | foreground | 0.52 | 0.66 |
| card | muted-foreground | 0.88 | 0.87 |
| card | primary | 0.86 | 0.80 |
| background | muted-foreground | 0.90 | 0.85 |

Muted text sets the limit. A light tint must be about 90% opaque, so on a MediWise screen glass is **frosted, not clear**. The depth comes from the blur, a top highlight, a soft shadow and a quiet colour wash behind the surface, not from content that shows through.

## Decisions

| Item | Value | Why |
| - | - | - |
| Where glass goes | The top bar, the phone tab bar, dialogs, the sign-in card and the report page header. The sidebar gets the tint without a blur. | These are navigation and frames. Apple keeps glass on this layer. Microsoft keeps tall side panes solid, and with a blur our sidebar made the dashboard slower in dark (INP 92 ms against 80 ms). |
| Where glass never goes | A marker value, a score, a status badge, a chart, a range bar, a list of results. | Results must read the same on every backdrop. No product we studied blurs a value. |
| Blur | Bars 12 px and surfaces 16 px, with `saturate(140%)`. Dialogs have no blur of their own. | Under the 20 px practice limit for large surfaces. The shadcn scrim under a dialog already blurs the page, so a second blur is glass on glass. With a 24 px dialog blur, opening the shortcuts dialog took 120 to 136 ms under a 4x CPU throttle. |
| Tint | `card` (surfaces), `background` (bars) and `popover` (dialogs) at 92% in light. 88% in dark, 90% for dialogs. | The lowest opacity that keeps foreground, muted-foreground and primary text at 4.5:1 or better over black (light) or white (dark). A test checks it. At 88% the dark dialog gave muted text 4.44:1. |
| Border | The normal 1 px `border` token. | The tint is so close to the card that a white hairline does not show in light. One edge colour stays one edge colour. |
| Highlight | A 1 px inset top line, white at 60% (light) and 6% (dark). | It reads as a lit edge, the one cue that tells a viewer "this layer floats". |
| Shadow | Floating panels only (cards, dialogs): `0 1px 2px` plus a soft `0 16px 40px -20px`. Bars have none. | DESIGN.md keeps flat surfaces flat. A glass panel floats, so it gets the one soft shadow. |
| Noise | None. | Noise hides banding in a strong blur over a vivid wallpaper. At 88 to 92% tint there is no banding to hide, and it would cost an image. |
| Colour wash | Two very soft radial washes, teal and warm stone, at the top of the app shell and the auth pages, fixed under the content. | Glass needs something behind it. The wash gives the frost a tint without a photo or a gradient on data. |
| Fallback, no `backdrop-filter` | The same surface at 100% opacity, no blur. | `@supports (backdrop-filter: blur(1px))` turns glass on. Safari 17 and older, and old Firefox, get the solid surface. |
| Fallback, reduced transparency | Solid. | `prefers-reduced-transparency: reduce` turns glass off where the browser supports it. |
| Fallback, slow device | Solid when `navigator.deviceMemory` is below 4 GB. | The pre-paint script in `index.html` sets `data-glass="off"` on the root. Safari does not report memory, and Apple devices blur on the GPU without trouble. |
| Fallback, print | Solid, no wash. | Print is black on white. |
| Contrast rule | Text on glass passes 4.5:1 with the tint composited over pure black (light) or pure white (dark). | It does not depend on the content under the surface, so one test proves it for every page. |
| Motion | No motion on the glass itself. Hover fills use 150 ms, `cubic-bezier(0.2, 0, 0, 1)`. Reduced motion turns transitions off. | The MEDI-41 rule: motion has a purpose, and reduced motion is respected. |

## Sources

- Apple, WWDC25 session 219, "Meet Liquid Glass": https://nonstrict.eu/wwdcindex/wwdc2025/219/
- Apple developer forums, WWDC25 design group lab summary: https://developer.apple.com/forums/thread/791070
- Apple newsroom, new software design (June 2025): https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- Microsoft, Acrylic material: https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
- Microsoft, Mica material: https://learn.microsoft.com/en-us/windows/apps/design/style/mica
- MDN, `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- caniuse, `backdrop-filter`: https://caniuse.com/css-backdrop-filter
- Safari 18 release notes: https://developer.apple.com/documentation/safari-release-notes/safari-18-release-notes
- MDN, `prefers-reduced-transparency`: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-transparency
- Chrome blog, `prefers-reduced-transparency`: https://developer.chrome.com/blog/css-prefers-reduced-transparency
- W3C, Understanding SC 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- BuildMVPFast, Liquid Glass CSS recipes (2026): https://www.buildmvpfast.com/blog/liquid-glass-css-backdrop-filter-recipes-2026
- Tailwind CSS, `backdrop-filter: blur()`: https://tailwindcss.com/docs/backdrop-filter-blur
- Instrument, Oura app case study: https://www.instrument.com/work/oura-app
- 9to5Google, Oura app redesign (Oct 2025): https://9to5google.com/2025/10/20/oura-app-redesign/
- WHOOP, brand and design guidelines (partner PDF): https://developer.whoop.com/assets/files/WHOOP%20-%20Brand%20&%20Design%20Guidelines-bdea3554e94b4ea09e68695b1e8dc8e7.pdf
- 925Studios, WHOOP design breakdown (Mar 2026): https://www.925studios.co/blog/whoop-design-breakdown
- the5krunner, WHOOP home screen revamp (Oct 2025): https://the5krunner.com/2025/10/15/whoop-homescreen-gets-a-revamp
- ZOE, ZOE 2.0 scores: https://zoe.com/learn/zoe-2-0-science-made-simple
- Which?, ZOE review: https://www.which.co.uk/reviews/nutrition-and-supplements/article/zoe-review-is-it-worth-it-aOVeL1R5BW52
- Eight Sleep, 2025 spring release: https://www.eightsleep.com/blog/discover-the-2025-spring-release/
- Anagrama, Eight branding: https://anagrama.com/project/eight
- Function Health: https://www.functionhealth.com
- Superpower: https://superpower.com/the-grove
- Style Dictionary releases and DTCG support: https://github.com/style-dictionary/style-dictionary/releases, https://styledictionary.com/info/dtcg/
- React Native colours (no `oklch()`, no `light-dark()`): https://reactnative.dev/docs/colors
