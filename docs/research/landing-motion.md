# Landing page motion and structure

Research date: 2026-10-15. Items marked unverified come from background knowledge, not a page read in this pass.

## Recommendation

- Add no animation library. Native CSS plus about 1 kB of IntersectionObserver code covers every effect the page needs. If a library becomes unavoidable, use Motion's mini animate (3.3 kB gz) plus inView (0.5 kB), never the motion component (43 kB gz) and never GSAP or Lenis.
- Scroll reveal: an IntersectionObserver adds a class, a CSS transition on transform and opacity does the work. animation-timeline: view() stays an enhancement behind @supports, because stable Firefox still needs a flag (one 2026 source, unverified) and the finished state must be the default so no browser ever sees opacity 0.
- Pinned phone demo: position sticky for the phone, an IntersectionObserver on the text steps sets data-step, screens crossfade by data-step. No scroll listener, no scroll-jacking, DOM order stays logical.
- Count-up: a requestAnimationFrame function of about 20 lines, started by the observer, final number shown under reduced motion.
- Marquee: CSS translateX keyframe on duplicated content (already in place).
- Hero background: two or three soft radial-gradient blobs drifting with transform keyframes over 20 to 40 seconds (no animated filter: blur, no animated background-position), plus one SVG path (an ECG pulse or a line chart drawing itself) with stroke-dashoffset and pathLength="1". Everything stays behind the content. The LCP element never animates opacity or transform.
- Pause: prefers-reduced-motion shows static final states (not slower motion), the Pause motion button sets the same attribute, a visibilitychange listener pauses rAF work, an observer pauses the hero when it leaves the viewport.

## Library costs (Motion docs, gzipped)

| Piece | Size |
|---|---|
| motion component | 43 kB, not tree-shakeable |
| m plus LazyMotion | about 5 kB plus domAnimation 24 kB or domMax 38 kB |
| useAnimate mini (WAAPI) | 3.3 kB |
| scroll() | about 3.8 kB, hands off to ScrollTimeline where available |
| inView() | 0.5 kB |

GSAP is free since the Webflow acquisition, about 23 kB core plus 10 kB ScrollTrigger (unverified). Lenis smooths wheel input only, blocks anchors unless configured, and adds risk to a sticky demo. React Spring is comparable to Motion in size. Auto Animate is for list changes. @starting-style is for display and DOM entry transitions, not scroll. View Transitions do not apply to a single static page.

## Native scroll-driven animations support

Chrome and Edge 115 and later. Safari 26 (September 2025) with fixes in 26.4 and 26.5. Firefox stable behind a flag as of mid 2026 (sources conflict). About 83% global (unverified). Rules: gate with @supports (animation-timeline: view()), declare animation-timeline after the animation shorthand (the shorthand resets it), make the finished state the default, animate transform and opacity only. Skip the flackr polyfill, use the observer fallback.

## Hero background patterns

- Gradient mesh or aurora blobs: 2 or 3 absolutely positioned radial-gradient layers moved with translate3d or rotate. Low GPU cost. Pre-blur with soft gradients instead of filter.
- Dot grid or noise: a static radial-gradient dot grid costs nothing. Animate a mask or a spotlight with transform only. Noise as a tiny tiled PNG or a static feTurbulence data URI, never animated.
- SVG stroke-dashoffset: cheap for one or two paths. pathLength="1" removes the dash maths.
- ECG pulse or a line chart that draws itself: the best fit for a health product. Draw once on load, then a slow loop. Use real marker names and reference-range bands from the sample report, never invented results presented as a person's.
- Floating marker chips: 4 to 6 static chips with a slow staggered float, real marker names.
- The mascot (line-drop, docs/design/mascot) can sit in the hero with its idle animation. It is already built, costs nothing new, and is the one element that reads as ours.
- Canvas particles and WebGL shaders (the Stripe gradient is WebGL): main-thread or battery cost, skip.

## Structure and the generic look

Tells of a generic page (vendor blogs and practitioner opinion agree): a centered hero with a purple gradient blob, three identical icon-title-line cards, the stock order hero, logos, features, testimonial, pricing, CTA, a default indigo palette, benefit copy that fits any product, every section centered and equal.

Fixes: a left-aligned hero with a real product visual beside it, one accent colour from the product, sections of different sizes and formats each led by a number, a before and after or a named flow, section order that follows the argument, one display font plus one body font.

For MediWise: one visual metaphor, a lab report that turns into a plain-language story. Sections must differ from each other: one wide pinned-device story, one full-bleed numeric strip with count-up, one two-column comparison, one narrow text block on privacy. Real data only, from the demo account. One accent plus the status colour pair.

How it works that cannot misalign: Option A, CSS grid with grid-template-rows: subgrid so the number, title, body and media rows align across columns, media in a fixed aspect-ratio box. Option B (preferred), a vertical stepper with the phone sticky at top 15vh in one column and tall steps (60 to 80vh) in the other, the observer sets data-step, screens crossfade. On phones drop the pin and stack text above screen.

Merge How it works and Across reports into one story of four or five steps (upload, read, explain, see a doctor line, trend across reports) on one pinned phone. Give the tall section content-visibility: auto with a contain-intrinsic-size close to its real height (a wrong estimate makes the scrollbar jump).

## References

- Mobbin: free tier has limited apps and no flows or animations. Pro is USD 10 per month billed yearly and adds flows, animations and search. Stronger for app screens than landing pages.
- Free galleries: Lapa Ninja, Land-book (filters by style and section), Landingfolio, Refero.
- Health and data pages to study live (notes unverified): Function Health (biomarker lists as the product), Superpower (biomarker panel as metaphor), InsideTracker (range bars), Levels (glucose line charts as hero), Oura (large typographic scores), Whoop (data cards), Zoe (editorial pacing), Ultrahuman (device-pinned scroll), Withings (product and metric pairing), Ro and Hims (plain-language trust structure).

## Component sources

Most copy-in libraries depend on Motion: Magic UI (Dot Pattern, Retro Grid, Blur Fade, Marquee, Number Ticker), Aceternity (Motion plus clsx), Motion Primitives (MIT, Motion). react-bits is MIT plus Commons Clause with some CSS-only backgrounds and some GSAP or Three.js ones. Tailwind Plus marketing sections are static HTML under a paid personal licence. Practical rule: copy the markup and the CSS of one effect and drop the library. None of them supplies a pinned device demo, build it with sticky plus the observer.

## Rules for the ticket

- Reduced motion: static final states, honoured live through matchMedia change events. Pause motion button uses the same attribute.
- No-JS and Firefox: reveal elements are visible by default, JS adds the hidden class, view() effects sit behind @supports.
- LCP element static, never behind a reveal, preloaded if an image.
- No scroll or resize listeners. Observers only, no layout reads in callbacks, rAF for the count-up, cancelled when done.
- Animate transform and opacity only. Explicit sizes or aspect-ratio on media (no CLS).
- will-change only on the few long-running layers.
- content-visibility: auto below the fold with a good intrinsic size.
- Observers created lazily and disconnected after use. Pause on document.hidden, off-screen and the button.
- Keyboard and screen readers: steps are ordinary content in DOM order, no focus trap, no scroll-jacking.
- Bundle gate: landing first load is 146 kB gz today. Any library must be named with its measured gz size and the gate must still pass.
- Lighthouse mobile before and after: LCP, INP or TBT, CLS, accessibility. Manual test with the OS reduced-motion setting on, in Safari and Chrome, light and dark.

## Sources

- motion.dev/docs/react-reduce-bundle-size, /docs/scroll, /docs/inview
- developer.chrome.com/docs/css-ui/scroll-driven-animations
- developer.mozilla.org animation-timeline, @starting-style, View Transition API
- web.dev/articles/content-visibility
- gsap.com/pricing, github.com/darkroomengineering/lenis, github.com/flackr/scroll-timeline
- superdesign.dev/blog/fix-generic-ai-landing-page
- mobbin.com/pricing, magicui.design/docs, github.com/DavidHDev/react-bits, github.com/ibelick/motion-primitives, ui.aceternity.com/licence, tailwindcss.com/plus/license
