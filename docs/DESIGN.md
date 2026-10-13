# MediWise design foundation

A calm health tool. Low saturation, warm neutrals, borders instead of shadows, one accent. Every token lives in `packages/design-tokens/tokens/*.json`, and `apps/web/src/styles/globals.css` imports the CSS the package builds. Components use token classes only (`bg-card`, `text-muted-foreground`). `packages/design-tokens/src/color.test.ts` fails when a text token drops under 4.5:1 on its surfaces. See [Design v2](#design-v2-tokens-and-glass).

The kitchen sink (`/dev/kitchen-sink`, dev builds only) shows every primitive and common component in both themes side by side.

## Theme mechanics

- Each colour token is declared once with `light-dark(light, dark)`. The nearest `color-scheme` picks the value.
- `[data-theme="light" | "dark"]` sets `color-scheme` on any element. The root carries the user's choice. No attribute means "match system".
- `index.html` applies the stored choice before first paint, so a page load does not flash. The choice is stored per browser in `localStorage` under `theme`. Settings and the user menu both change it.
- The `dark:` variant follows the closest `[data-theme]`, for one nested panel at most. Do not nest themes deeper than root plus one panel.
- Print is always black on white.

## Palette

| Token | Light | Dark | Use |
| - | - | - | - |
| background | `#FBFAF7` | `#181715` | Page |
| card / popover | `#FFFEFD` | `#1E1D1B` / `#232120` | Raised surfaces |
| sidebar | `#F7F5F1` | `#141211` | Side and bottom navigation |
| muted / secondary | `#F2F0EC` | `#262523` | Quiet fills, skeletons |
| accent | `#EFECE8` | `#2D2B29` | Hover fill |
| border / input | `#E0DDDA` / `#D7D4CF` | `#32302E` / `#3C3A38` | Every edge |
| foreground | `#201C19` | `#ECEBE8` | Text |
| muted-foreground | `#68625E` | `#A8A49F` | Secondary text |
| primary | `#176B6B` | `#76C8C7` | The one accent: actions, links, active nav, score ring |
| ring | `#2D8A8A` | `#56A8A7` | Focus rings |
| destructive | `#B63132` | `#F47B74` | Delete actions and form errors only |
| chart-1 to chart-5 | `#176B6B` `#568999` `#5E617A` `#7B6F66` `#99B4B4` | `#76C8C7` `#74A8B8` `#9EA2C4` `#A69C95` `#567979` | Chart series, never status |

Status scale, for results only (a marker, a pattern, a score change):

| Status | Text and mark, light / dark | Soft fill, light / dark |
| - | - | - |
| optimal | `#31693F` / `#89D298` | `#E1F5E4` / `#1F3423` |
| watch | `#875814` / `#EDBF71` | `#FDECD1` / `#3E2D15` |
| risk | `#A63C0C` / `#F99C7C` | `#FEE9E2` / `#48261A` |
| unknown | `#5D646C` / `#A7AFB7` | `#EBEFF2` / `#2B2E32` |

Each status colour passes 4.5:1 on its soft fill, the background and the card, in both themes (lowest is 5.2:1).

Why these choices:

- **Teal, not sage.** Sage sits next to the "optimal" green, so a sage button reads as a good result. Teal (hue 195) stays clinical and calm, and it is clearly apart from every status hue.
- **Warm stone neutrals.** Pure grey reads as a default template. A hue of about 70 with very low chroma feels like paper and keeps text crisp.
- **Lifted charcoal in dark.** Pure black makes bright text glow and hides borders. `#181715` keeps edges visible and is easier on the eyes at night.
- **Risk is red-orange (hue 40), destructive is red (hue 25).** A delete button must not look like a lab result.

## Type

| Token | Size / line height | Use |
| - | - | - |
| `text-display` + `font-display` | 36 / 40, Instrument Serif | The one page title (`PageHeader`) |
| `text-3xl` | 30 / 36 | Score numbers |
| `text-2xl` | 24 / 32 | Verdict line |
| `text-xl` | 20 / 28 | Section titles |
| `text-lg` | 17 / 26 | Lead text |
| `text-base` | 15 / 24 | Body |
| `text-sm` | 14 / 20 | Labels, secondary text, controls |
| `text-xs` | 12 / 16 | Captions |

- **Inter** for the UI. Body text uses tabular numbers, so columns of values line up.
- **JetBrains Mono** (`font-mono`) for values and units. Give the unit `text-muted-foreground`.
- **Instrument Serif** for at most one heading per screen. `PageHeader` already uses it, so do not add another.
- Fonts load from Google Fonts in `index.html`.

## Spacing and layout

- 4 px grid (Tailwind spacing). Inside a component: 2, 3 or 4. Between blocks in a section: 6. Between sections: 10 or 12.
- Content width `max-w-content` (1600 px), padding 16 px on mobile and 32 px from `md`. See [Layout widths](#layout-widths).
- Prose blocks use `max-w-measure` (72ch). Do not use `max-w-prose`, Tailwind fixes it at 65ch.
- Auth column width `max-w-auth` (420 px). On a phone the column is full width with 16 px gutters.
- The side navigation is 240 px, or 56 px when collapsed, from `md`. Below `md`, a bottom tab bar replaces it. See [Navigation](#navigation).
- Radius scale from `--radius` (8 px): `rounded-md` for controls, `rounded-xl` for cards, panels and empty states.

## Elevation

- Surfaces separate with a 1 px border or ring, never a shadow. `shadow-xs` and `shadow-sm` render nothing.
- Only overlays (menus, select lists, toasts, sheets) use `shadow-md` and up, which map to one soft overlay shadow.
- A card is one step lighter than the page in both themes. In dark, a popover is one more step lighter.
- Glass panels (`GlassCard`, the glass `PageHeader`, `GlassDialogContent`) use `shadow-(--shadow-glass)`: a lit top edge and one soft shadow. Glass bars (top bar, sidebar, tab bar) have no shadow.

## Do and do not

| Do | Do not |
| - | - |
| `className="bg-card text-muted-foreground"` | `className="bg-[#fff] text-gray-500"` |
| `<StatusBadge status="watch" />` next to a marker | `text-optimal` on a success toast, a button or a "saved" message |
| `font-mono` for `5.42 mmol/L` | Serif on a section title or a card title |
| `variant="destructive"` for delete | `bg-risk` on a delete button |
| A border to separate a card | `shadow-lg` on a card |

## Brand

The mark is a drop with a reading line: a blood sample and the value read from it. The maintainer chose it on 2026-10-13 from three candidates, see the [renders](design/logo/candidates/).

| Part | Source |
| - | - |
| Mark | `apps/web/public/favicon.svg`, a 20 x 20 grid. `common/components/brand/logo.tsx` carries the same path. Change both together. |
| Wordmark | "MediWise" in Inter SemiBold, letter spacing -0.025em. `docs/design/logo/wordmark.svg` holds the outlines for raster files. |
| Components | `LogoMark`, `Wordmark` and `Logo` (mark plus wordmark) in `common/components/brand/logo.tsx`. |
| Raster files | `node scripts/generate-brand-assets.mjs` writes `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `og-image.png` in `apps/web/public`. Run it after the mark changes and commit the output. |

Why Inter for the wordmark: Instrument Serif is for one heading per screen, and `PageHeader` already uses it. The logo is on every screen, so a serif logo would make two. Inter SemiBold also stays clear at 15 px in the side navigation.

Rules:

- **Clear space.** Keep half the mark height free on every side. Between the mark and the wordmark, the gap is a third of the mark height (8 px next to a 24 px mark).
- **Minimum size.** The mark alone is 16 px tall. The mark with the wordmark is 20 px tall. At 16 px the reading line is 2 px thick and sits on whole pixels, also at 32 and 48 px.
- **Two colour versions.** Teal: `text-primary` (`#176B6B` light, `#76C8C7` dark). Neutral: `text-foreground` (`#201C19` light, `#ECEBE8` dark). Use teal by default and neutral where a second colour would be noise.
- **App icons** reverse the teal version: a mark in the background colour (`#FBFAF7`) on a full teal tile, so it shows on any wallpaper. The mark is 55% of the tile height, inside the safe zone of a maskable icon.
- **favicon.svg** switches to the dark teal with `prefers-color-scheme`. `favicon.ico` cannot switch, so it uses the ring teal (`#2D8A8A`), which shows on light and dark tab bars.
- **Theme colour.** `index.html` sets `theme-color` for light (`#FBFAF7`) and dark (`#181715`) from the system setting. `site.webmanifest` can hold one value only, so it uses the light background.

| Do | Do not |
| - | - |
| `<Logo />` or `<LogoMark />` | Copy the SVG path into a new file |
| Teal or neutral | A status colour (optimal, watch, risk) on the mark |
| The mark flat, one colour | A gradient, shadow, outline or second colour |
| The reading line as drawn | Remove, move or rotate the line, or stretch the drop |
| The wordmark in Inter SemiBold | The wordmark in Instrument Serif or any other font |
| The teal mark on the background, card or sidebar | The teal mark on a teal fill or a photo |

Screenshots on 2026-10-13, web dev server, no data loaded:

| Page | Light | Dark |
| - | - | - |
| Sign in | [light](design/logo/login-light.jpg) | [dark](design/logo/login-dark.jpg) |
| App shell | [light](design/logo/shell-light.jpg) | [dark](design/logo/shell-dark.jpg) |
| App shell, phone | [light](design/logo/shell-light-phone.jpg) | [dark](design/logo/shell-dark-phone.jpg) |
| Link preview | [og-image.png](../apps/web/public/og-image.png) | |

## Primitives and libraries

The primitives in `src/components/ui` come from the shadcn CLI with the `vega` preset (`pnpm dlx shadcn@latest apply vega`): Lucide icons, Inter, the classic density. We did not install the preset's `@fontsource-variable/inter` package because fonts load from Google Fonts. To regenerate a component, run `pnpm dlx shadcn@latest add <name> --overwrite` from `apps/web`.

We checked these collections on 2026-10-12 and adopted none. No primitive is missing, and each one fails at least one rule (free, no new runtime dependency, shadcn registry, Radix base).

| Library | Verdict |
| - | - |
| Origin UI (now coss) | Skip. Origin is a frozen snapshot, and coss ui is built on Base UI, not Radix. |
| affectui.com | Skip. The site shows no licence, repository or install path. |
| kobra.systems | Skip. Proprietary, the free tier is personal use only, and it needs `motion`. |
| uiarc.dev | Skip. Needs `motion`, Pro licence is restrictive, Tailwind v4 support is not stated. |
| evilcharts.com | Skip. MIT and current, but it ignores `--chart-*`, has no sparkline or reference band, and adds `motion`. |
| transitions.dev | Skip. Custom licence and its own CLI, not a shadcn registry. |
| beui.dev | Skip. `motion` is a core dependency. |
| boardui.com | Skip. Its own CLI, no shadcn registry, and it brings React Aria and TanStack Table. |

Charts: for the trend and marker charts in MEDI-35, prefer the shadcn `chart` component. It reads `--chart-1` to `--chart-5` and supports a reference band through Recharts `ReferenceArea`. Its Recharts dependency is a registry component dependency, so MEDI-35 names it in its report.

## Screenshots

Screenshots use the demo account (made-up profile "Arjun Mehta", the two sample reports in `apps/api/fixtures/golden`). Never capture a real report. Full page at 1440 px.

| Page | Screenshot |
| - | - |
| Dashboard, light | [after](design/after-dashboard-light.png) |
| Dashboard, dark | [after](design/after-dashboard-dark.png) |
| Report, light | [after](design/after-report-light.png) |
| Report, dark | [after](design/after-report-dark.png) |

Lighthouse accessibility on 2026-10-12 (desktop, dev server): 99 on `/` and the report page in both themes. The only failure was `role="img"` on the ScoreRing `<figure>`. After the fix, the report page in dark scores 100.

## Pages (MEDI-35)

Every screen uses the foundation above. The patterns below repeat across pages, so a new page starts from them.

- **Page title.** `PageHeader` on every page, with the actions on the right. The marker page and the auth card use the same display font for their title.
- **Section.** `Section` from `common/components` gives every section one header: a `text-xl` title, an optional one-line description and an optional action link.
- **Rows.** A list is one card with `divide-y`, rows at `px-4 py-3`, a status mark or badge, and the value right-aligned in `font-mono`.
- **Insight card.** Patterns and findings use `InsightCard`: title, status badge on the right, body, then marker chips. A chip shows the marker name and its value in `font-mono`.
- **Values.** `MarkerValue` writes every number in JetBrains Mono, with the unit in `text-muted-foreground`. Printed text values stay in Inter.
- **Status colour.** Status colours mark results only: marker status, pattern severity, trend direction, the score change since the last visit and the status meter on the dashboard. A notice that is not a result uses `bg-muted`.
- **Charts.** `ValueChart` in `common/components` draws the marker trajectory and the trend detail. It uses the shadcn `chart` component, the line is `--chart-1`, each dot has its status colour, and the optimal range is a `ReferenceArea` band. Sparklines draw with `stroke-chart-1`.
- **Sticky bars.** The marker filter on the report and the compare table header stick under the app header (`top-12`).
- **Footer.** The app shell and the auth pages show the disclaimer once, with links to the four policy pages.
- **Doctor export.** The export page sets `data-theme="light"`, so it stays black on white in both themes and in print.
- **Previous values on the export (MEDI-53).** The Move first and Markers tables get a Previous column between Value and Unit. It shows the value from the profile's previous done report, with ↑ or ↓ when the printed values differ. The mark has a screen reader label ("Higher now", "Lower now"). One line under the profile block names the previous report. A first report shows no column and no line. The page fits A4 portrait with the column.
- **Year in review (MEDI-60).** `/year-review` opens from a profile card (two reports or more) and from a card on Home under the latest report. The page shows the intro, three tiles (score, reports, labs), then Markers that moved, Markers still at risk and Markers measured once. The window ends at the latest report and starts 13 months before it, so a yearly test that comes a few weeks late still counts. A profile with fewer than two visits in the window gets a 404 from the API and shows no card. Print hides the app sidebar, header and tab bar, so every app page prints black on white with its content only.
- **Year in review cost (MEDI-60).** The intro is one claude-haiku-5-5 call with the narrative validator, cached on the profile under a hash of the model, prompt and facts. Measured on the demo profile on 2026-10-13, 4 runs: 578 input tokens, 1,131 cached prompt tokens and 287 to 328 output tokens, 0.021 to 0.023 cents a call. Every run passed the validator on the first try. With no prompt cache and one retry, the worst case is about 0.07 cents, under the 0.2 cent limit. A second open costs nothing.

Decisions:

- **We capped the score** was in the watch colour. It is not a result, so it is now a neutral note with an info icon.
- **Recharts** came in as the dependency of the shadcn `chart` registry component. It is the only new runtime dependency.
- **Settings** puts each title and description on the left and the controls in a card on the right, from `md`.

Screenshots: the demo account (made-up profile "Arjun Mehta", the two sample reports in `apps/api/fixtures/golden`), report "Sunrise Diagnostics, 9 Mar 2024". Desktop is a full page at 1440 px. Phone is a full page at 390 px. At 390 px no page scrolls sideways.

| Page | Light | Dark | Phone |
| - | - | - | - |
| Dashboard | [after](design/pages/after-dashboard-light.jpg) | [after](design/pages/after-dashboard-dark.jpg) | [after](design/pages/after-dashboard-light-phone.jpg) |
| Home, Your family (MEDI-51), 1440 and 1920 px, phone at 390 px; with only the self profile: [light](design/pages/after-family-self-light-1440.jpg), [phone](design/pages/after-family-self-light-390.jpg) | [after](design/pages/after-family-light-1440.jpg), [1920](design/pages/after-family-light-1920.jpg) | [after](design/pages/after-family-dark-1440.jpg), [1920](design/pages/after-family-dark-1920.jpg) | [light](design/pages/after-family-light-390.jpg), [dark](design/pages/after-family-dark-390.jpg) |
| Home, Due for retest (MEDI-54). The demo report has HbA1c and ACR in range, so the two rows are added to the dashboard response in the browser for the capture | [after](design/pages/after-retest-light.jpg) | [after](design/pages/after-retest-dark.jpg) | [light](design/pages/after-retest-light-phone.jpg), [dark](design/pages/after-retest-dark-phone.jpg) |
| Report with findings and studies (29 Mar 2025) | [after](design/pages/after-report-studies-light.jpg) | | |
| Report | [after](design/pages/after-report-light.jpg) | [after](design/pages/after-report-dark.jpg) | [after](design/pages/after-report-light-phone.jpg) |
| Marker | [after](design/pages/after-marker-light.jpg) | [after](design/pages/after-marker-dark.jpg) | [after](design/pages/after-marker-light-phone.jpg) |
| Trends | [after](design/pages/after-trends-light.jpg) | [after](design/pages/after-trends-dark.jpg) | [after](design/pages/after-trends-light-phone.jpg) |
| Trend detail | [after](design/pages/after-trend-light.jpg) | [after](design/pages/after-trend-dark.jpg) | [after](design/pages/after-trend-light-phone.jpg) |
| Compare | [after](design/pages/after-compare-light.jpg) | [after](design/pages/after-compare-dark.jpg) | [after](design/pages/after-compare-light-phone.jpg) |
| Year in review (MEDI-60), 9 Mar 2024 to 29 Mar 2025, no marker moved status; [print](design/pages/after-year-review-print.jpg) | [after](design/pages/after-year-review-light.jpg) | [after](design/pages/after-year-review-dark.jpg) | [light](design/pages/after-year-review-light-phone.jpg), [dark](design/pages/after-year-review-dark-phone.jpg) |
| Home, Year in review card (MEDI-60) | [after](design/pages/after-year-review-home-light.jpg) | [after](design/pages/after-year-review-home-dark.jpg) | [after](design/pages/after-year-review-home-light-phone.jpg) |
| Home, Confirm your family profiles (MEDI-61). Two made-up family profiles with the consent dates cleared for the capture | [after](design/pages/after-consent-home-prompt-light.jpg) | | [after](design/pages/after-consent-home-prompt-light-phone.jpg) |
| Reports | [after](design/pages/after-reports-light.jpg) | [after](design/pages/after-reports-dark.jpg) | [after](design/pages/after-reports-light-phone.jpg) |
| Upload; with a photo warning (MEDI-55): [light](design/pages/after-upload-warning-light.jpg), [phone](design/pages/after-upload-warning-light-phone.jpg) | [after](design/pages/after-upload-light.jpg) | [after](design/pages/after-upload-dark.jpg) | [after](design/pages/after-upload-light-phone.jpg) |
| Profiles | [after](design/pages/after-profiles-light.jpg) | [after](design/pages/after-profiles-dark.jpg) | [after](design/pages/after-profiles-light-phone.jpg) |
| Add a family member, a child saved without the two ticks (MEDI-61), viewport only | [after](design/pages/after-consent-child-form-refused-light.jpg) | | |
| Privacy policy with family, children and deletion records (MEDI-61) | [after](design/pages/after-consent-privacy-light.jpg) | | |
| Settings | [after](design/pages/after-settings-light.jpg) | [after](design/pages/after-settings-dark.jpg) | [after](design/pages/after-settings-light-phone.jpg) |
| Credits | [after](design/pages/after-credits-light.jpg) | [after](design/pages/after-credits-dark.jpg) | [after](design/pages/after-credits-light-phone.jpg) |
| Doctor export with previous values (29 Mar 2025, previous 9 Mar 2024, MEDI-53) | [after](design/pages/after-export-light.jpg) | [after](design/pages/after-export-dark.jpg) | [after](design/pages/after-export-light-phone.jpg) |
| Report, Notes for this visit after a save (MEDI-63), 29 Mar 2025 | [after](design/pages/after-visit-note-report-light.jpg) | | |
| Doctor export with the visit note under the visit dates (MEDI-63) | [after](design/pages/after-visit-note-export-light.jpg) | | |
| Share-with-doctor page with the visit note (MEDI-63). The link was ended after the capture | [after](design/pages/after-visit-note-share-light.jpg) | | |
| Sign in | [before](design/pages/before-login-light.jpg), [after](design/pages/after-login-light.jpg) | [before](design/pages/before-login-dark.jpg), [after](design/pages/after-login-dark.jpg) | [after](design/pages/after-login-light-phone.jpg) |
| Create account | [before](design/pages/before-signup-light.jpg), [after](design/pages/after-signup-light.jpg) | [before](design/pages/before-signup-dark.jpg), [after](design/pages/after-signup-dark.jpg) | [after](design/pages/after-signup-light-phone.jpg) |
| Forgot password | [before](design/pages/before-forgot-password-light.jpg), [after](design/pages/after-forgot-password-light.jpg) | [before](design/pages/before-forgot-password-dark.jpg), [after](design/pages/after-forgot-password-dark.jpg) | [after](design/pages/after-forgot-password-light-phone.jpg) |
| Reset password | [before](design/pages/before-reset-password-light.jpg), [after](design/pages/after-reset-password-light.jpg) | [before](design/pages/before-reset-password-dark.jpg), [after](design/pages/after-reset-password-dark.jpg) | [after](design/pages/after-reset-password-light-phone.jpg) |

Lighthouse accessibility on 2026-10-12 (desktop, dev server, Lighthouse 12.8.2): 100 on `/`, the report page and `/trends`, in both themes. The first run gave the report page 96 in light, because the inactive tab label (`text-foreground/60` in the vega `TabsTrigger`) was 4.26:1. The report page now passes `text-muted-foreground` to its tabs.

## Navigation

The app shell lives in `src/layouts`. The five destinations are Home, Reports, Trends, Profiles and Settings. `layouts/nav.ts` holds them, their shortcut keys and the page titles for the breadcrumb.

- **Sidebar.** 240 px wide, 56 px collapsed to icons. A collapsed row shows its label in a tooltip. Rows are 32 px tall with a 16 px icon. The active row has `bg-primary/10` and `text-primary`. A "Menu" label sits above the list. The logo is at the top. Collapsed, the sidebar shows the mark only.
- **Collapse.** The button in the sidebar footer or the `[` key. The browser keeps the choice in `localStorage` under `sidebar`.
- **Profile switcher.** In the sidebar footer: the initial, the name and the relation. The menu lists every profile and links to Manage profiles. Below `md`, the switcher is in the header.
- **Header.** 48 px. It shows the page title, and the breadcrumb on inner pages. A border shows only after the page scrolls. On the right: the upload button (Home and Reports only), the theme toggle and the user menu.
- **Breadcrumb names.** A page names its own crumb with `useCrumbLabel(path, label)`, for example the lab name of a report. Without a label, the crumb uses the title in `nav.ts`.
- **Phone, under 768 px.** A bottom tab bar with the five destinations and the upload action in the middle. The breadcrumb of an inner page moves above the page title.
- **Keyboard.** `G` then `H`, `R`, `T`, `P` or `S` goes to a destination. `[` collapses or expands the sidebar. `?` opens the shortcuts dialog. Shortcuts do not fire while focus is in a text field. Focus rings use `ring-ring/50` at 3 px.
- **Overlays.** Dialogs, menus and toasts follow the page theme, as before.

Screenshots on 2026-10-13, web dev server, the demo account (made-up profile "Arjun Mehta", the two sample reports in `apps/api/fixtures/golden`). Desktop is 1440 x 900.

| Shell | Light | Dark |
| - | - | - |
| Desktop, expanded | [light](design/pages/after-shell-light.jpg) | [dark](design/pages/after-shell-dark.jpg) |
| Desktop, collapsed | [light](design/pages/after-shell-light-collapsed.jpg) | [dark](design/pages/after-shell-dark-collapsed.jpg) |
| Header after scroll, report | [light](design/pages/after-shell-light-scrolled.jpg) | |
| Shortcuts dialog | | [dark](design/pages/after-shell-dark-shortcuts.jpg) |
| Phone tab bar | [light](design/pages/after-shell-light-phone.jpg) | [dark](design/pages/after-shell-dark-phone.jpg) |

Lighthouse accessibility on 2026-10-13 (desktop, dev server, Lighthouse 12.8.2): 100 on `/`, the report page and `/trends`, in both themes, with the sidebar expanded. With the sidebar collapsed, `/` and the report page also score 100 in both themes.

## Layout widths

Every page fits the window from 390 px to 1920 px, with no sideways scroll.

- **Content area.** Fluid up to 1600 px, with 32 px gutters from `md`. Before, it stopped at 1100 px and left wide empty margins.
- **Grids.** Patterns, findings, follow-ups and studies on the report use 2 columns from `md` and 3 from `2xl` (1536 px). Unmeasured markers use 3 from `xl` (1280 px) and 4 from `2xl`. Profiles use 3 from `xl` and 4 from `2xl`.
- **Tables and charts** take the full content width.
- **Prose** stays at 72ch (`max-w-measure`).
- **Forms.** Settings stops at 1024 px (`max-w-5xl`), so a text field is not 1200 px wide.
- **768 to 1023 px.** The sidebar takes 240 px, so the content is about 460 px wide. Page headers put their actions under the title until `lg`. The compare table keeps the phone columns until `lg`. Settings puts each title above its card until `lg`.

Checked on 2026-10-13 at 390, 768, 1024, 1440 and 1920 px: Home, Reports, report, marker, Trends, trend, Compare, Upload, Profiles, Settings and Credits.

| Page | 390 px | 1440 px | 1920 px |
| - | - | - | - |
| Dashboard | [after](design/pages/after-width-dashboard-light-phone.jpg) | [after](design/pages/after-width-dashboard-light.jpg) | [after](design/pages/after-width-dashboard-light-1920.jpg) |
| Report | [after](design/pages/after-width-report-light-phone.jpg) | [after](design/pages/after-width-report-light.jpg) | [after](design/pages/after-width-report-light-1920.jpg) |

## Landing page (MEDI-41)

`apps/landing` is the public page at `https://mediwise.theyashgupta.me`. It imports its tokens from `@mediwise/design-tokens` and uses the same fonts and logo as the app. The research behind it is in [landing-research.md](design/landing-research.md).

Sections, in order: navigation, hero, marker marquee, how it works, the report story, the comparison card, features, numbers, trust, pricing, FAQ, the last call to action and the footer.

Rules:

- **Real screens only.** Every phone on the page shows a screen from the app, captured at 390 px from the dev data. Lab names, doctor names and the profile name are removed before capture. The values are real.
- **Numbers come from code.** Prices come from `payments.config.ts`. Counts (137 markers, 15 patterns, 80 sources, 20 files, 8 profiles) come from the engine and `@mediwise/shared` when the page builds. `src/lib/facts.test.ts` fails when a number on the page and its source differ.
- **Words.** "Built to follow the DPDP Act 2023", never "compliant". No free first read, because a new account has 0 credits. No user counts and no testimonials until real ones exist.
- **One serif.** Instrument Serif is used for the hero headline only. Section titles use Inter.
- **Navigation bar.** 56 px tall from `md`, 52 px on a phone. Every item is 14 px text. The logo mark is 24 px. "Read my report" is 32 px tall with 12 px side padding. "Sign in" is a text link 16 px to its left. The bar is sticky. Its glass background and bottom border show only after the page scrolls, as in the app header.
- **Section spacing.** A section has 48 px padding at the top and bottom on a phone, and 80 px from `md`. The marquee and trust bands have 48 px and 64 px. A section is only as tall as its content. Each report story step has 48 px padding from `lg`, not a viewport height. A full-page capture at 1200 px has no blank stretch taller than 120 px.
- **The rupee sign.** A local font face covers only U+20B9. Without it, the sign alone downloads about 100 kB of latin-ext font files.

Motion:

- Every animation moves `transform` or `opacity` only. JavaScript sets data attributes, and CSS does the motion.
- The hero phone rises once on load. It does not fade, because a fade on the LCP image delayed LCP by about 1.5 s on a throttled phone.
- Scroll progress, the navigation backdrop, section fades and the four report scenes use CSS scroll-driven animations (`animation-timeline`) behind `@supports`. Where a browser does not support them, the backdrop stays on, the progress bar is hidden and IntersectionObserver switches the scenes.
- **Content shows before motion.** A section fade fills forwards only, so an element below the screen keeps full opacity until its range starts. No JavaScript hides content. A full-page capture and a browser without JavaScript show every section.
- The counters show the true number until they come into view. Then they count up once.
- **Pause motion** (in the hero and at the marquee) sets `data-motion="paused"` on the root and keeps the choice in `localStorage`. It stops every animation. The OS reduced-motion setting does the same, and the marquee then shows its names as a still list.

Libraries:

- Magic UI and Launch UI are MIT (licences checked on GitHub on 2026-10-13). We used their patterns (marquee, number ticker, device frame, stats, FAQ) but copied no code. Their versions need `motion`, hard-coded greys or `tailwind-merge`, and the page could not afford them.
- The FAQ uses the Radix accordion from `radix-ui`, as the app does.
- No Aceternity, no GSAP, no Lenis, no video.

Performance on 2026-10-13 (production build served with compression by `npx serve`, Lighthouse 12.8.2, mobile, devtools throttling: slow 4G and 4x CPU, 3 runs per theme):

| | Light | Dark |
| - | - | - |
| Performance (median, range) | 90 (81 to 99) | 91 (70 to 99) |
| Accessibility, best practices, SEO | 100, 100, 100 in every run | 100, 100, 100 in every run |
| LCP (median, range) | 2.1 s (2.1 to 2.2 s) | 2.1 s (2.0 to 2.8 s) |
| CLS | 0.001 | 0.001 |

The low runs had 700 ms to 2.2 s of blocking time while other sessions loaded the machine (load average 5). The quiet runs scored 99. First-load JavaScript is 145 kB gzipped, of which Next.js and React are 134 kB. The CSS is inlined in the HTML (`experimental.inlineCss`), which took the light LCP from 2.6 to 2.9 s down to 2.1 s.

Screenshots, full page with motion paused (MEDI-41):

| Width | Light | Dark |
| - | - | - |
| 1440 px | [light](design/pages/landing-light.jpg) | [dark](design/pages/landing-dark.jpg) |
| 390 px | [light](design/pages/landing-light-phone.jpg) | [dark](design/pages/landing-dark-phone.jpg) |

Screenshots before and after MEDI-56, full page with motion on, production build. The before shots show the blank sections and the 64 px bar with 40 px buttons.

| Width | Light | Dark |
| - | - | - |
| 390 px | [before](design/pages/landing-light-390-before.jpg), [after](design/pages/landing-light-390-after.jpg) | [before](design/pages/landing-dark-390-before.jpg), [after](design/pages/landing-dark-390-after.jpg) |
| 768 px | [before](design/pages/landing-light-768-before.jpg), [after](design/pages/landing-light-768-after.jpg) | [before](design/pages/landing-dark-768-before.jpg), [after](design/pages/landing-dark-768-after.jpg) |
| 1280 px | [before](design/pages/landing-light-1280-before.jpg), [after](design/pages/landing-light-1280-after.jpg) | [before](design/pages/landing-dark-1280-before.jpg), [after](design/pages/landing-dark-1280-after.jpg) |
| 1920 px | [before](design/pages/landing-light-1920-before.jpg), [after](design/pages/landing-light-1920-after.jpg) | [before](design/pages/landing-dark-1920-before.jpg), [after](design/pages/landing-dark-1920-after.jpg) |

Lighthouse after MEDI-56 (Lighthouse 12.8.2, mobile, 3 runs per theme, before and after builds on the same server):

| | Before | After |
| - | - | - |
| Performance (median, light and dark) | 73, 73 | 73, 73 |
| Accessibility | 100 in every run | 100 in every run |
| CLS | 0.001 or less | 0.001 or less |

That server sends files without compression, so LCP is 6.2 s in both builds. Compare these runs with each other, not with the MEDI-41 table. First-load JavaScript is 145 kB gzipped before and after, without the `nomodule` polyfill.

## Auth pages (MEDI-46)

The sign in, create account and password reset pages show the brand first, then one card.

- **Logo.** `AuthLayout` shows `<LogoLink size="large" />`, centred above the card. The mark is 48 px from `md` and 32 px on a phone. The wordmark is `text-3xl` from `md` and `text-xl` on a phone, so it keeps the 24 px to 15 px ratio of the default logo. The gap between the mark and the wordmark is a third of the mark height. The mark is the teal version in both themes.
- **Space to the card.** 24 px on a phone, 32 px from `md` (`gap-6`, `md:gap-8`).
- **Card.** `max-w-auth` (420 px). The title is `font-display text-display`, the same size as the `PageHeader` title. One line of help text follows at `gap-2`. Then the Google button, the "or use your email" divider and the form, `gap-6` apart.
- **Footer.** The disclaimer and the policy links use the card width.

Screenshots on 2026-10-13, web dev server, signed out. Full page at 390 px and 1440 px. At 390 px no auth page scrolls sideways.

| Page | Light, 390 px | Light, 1440 px | Dark, 390 px | Dark, 1440 px |
| - | - | - | - | - |
| Sign in | [before](design/pages/auth-login-light-390-before.jpg), [after](design/pages/auth-login-light-390-after.jpg) | [before](design/pages/auth-login-light-1440-before.jpg), [after](design/pages/auth-login-light-1440-after.jpg) | [before](design/pages/auth-login-dark-390-before.jpg), [after](design/pages/auth-login-dark-390-after.jpg) | [before](design/pages/auth-login-dark-1440-before.jpg), [after](design/pages/auth-login-dark-1440-after.jpg) |
| Create account | [before](design/pages/auth-signup-light-390-before.jpg), [after](design/pages/auth-signup-light-390-after.jpg) | [before](design/pages/auth-signup-light-1440-before.jpg), [after](design/pages/auth-signup-light-1440-after.jpg) | [before](design/pages/auth-signup-dark-390-before.jpg), [after](design/pages/auth-signup-dark-390-after.jpg) | [before](design/pages/auth-signup-dark-1440-before.jpg), [after](design/pages/auth-signup-dark-1440-after.jpg) |
| Forgot password | [before](design/pages/auth-forgot-password-light-390-before.jpg), [after](design/pages/auth-forgot-password-light-390-after.jpg) | [before](design/pages/auth-forgot-password-light-1440-before.jpg), [after](design/pages/auth-forgot-password-light-1440-after.jpg) | [before](design/pages/auth-forgot-password-dark-390-before.jpg), [after](design/pages/auth-forgot-password-dark-390-after.jpg) | [before](design/pages/auth-forgot-password-dark-1440-before.jpg), [after](design/pages/auth-forgot-password-dark-1440-after.jpg) |

Lighthouse accessibility on 2026-10-13 (desktop, dev server, Lighthouse 12.8.2): 100 on `/login` in light and in dark.

## Design v2: tokens and glass

MEDI-47, 2026-10-13. The research, the seven products and the derivation of each value are in [research-design-v2.md](design/research-design-v2.md).

Verdict: MediWise uses **frosted glass on the frame, solid surfaces on the results**. Glass goes on the navigation layer and on frames that hold no result. A number, a score, a status, a chart or a list of results stays on a solid surface. Glass is at least 88% opaque, so the page reads as calm paper with a lit, layered frame, not as a see-through dashboard.

### One token source

`packages/design-tokens` holds every token as DTCG JSON (`$type`, `$value`, colours as `oklch` objects): colour, spacing, radius, type scale, shadow, blur and motion, light and dark.

| Output | File | Used by |
| - | - | - |
| CSS custom properties | `build/tokens.css` | `apps/web`, through `@import "@mediwise/design-tokens/tokens.css"` in `globals.css` |
| TypeScript | `build/tokens.ts` (`import { tokens } from "@mediwise/design-tokens"`) | The Expo app later. Colours are hex or `rgba()`, sizes are px numbers, durations are ms numbers, and each theme is its own object, because React Native reads neither `oklch()` nor `light-dark()`. |

- **Change a token:** edit `tokens/*.json`, then run `pnpm --filter @mediwise/design-tokens build` and commit `build/`. A test fails when `build/` does not match the JSON. `pnpm build` also runs it before the web build.
- **Names did not change.** Every variable shadcn and `globals.css` used before (`--background`, `--primary`, `--radius`, `--shadow-overlay`, `--text-*`, `--font-*`) has the same name and value, so every component works as before.
- **Status colours did not change.** A test fails when a status colour or its soft fill gets an alpha.
- **Style Dictionary 5.5.5** is a dev dependency of the token package only. It reads the JSON and resolves references. Two small formats in `src/formats.ts` write the CSS and the TypeScript. `apps/web` has no new runtime dependency.
- The landing page (`apps/landing`) still keeps its own copy of the type scale. Moving it to the package is a follow-up.

New tokens:

| Token | Light | Dark | Use |
| - | - | - | - |
| `glass-tint-surface` | `card` at 92% | `card` at 88% | `GlassCard`, glass `PageHeader` |
| `glass-tint-bar` | `background` at 92% | `background` at 88% | Top bar, sidebar (no blur), phone tab bar |
| `glass-tint-overlay` | `popover` at 92% | `popover` at 90% | `GlassDialogContent` |
| `ambient-1`, `ambient-2` | soft teal, warm stone | dark teal, dark stone | The wash behind the shell and the auth pages |
| `blur-glass-bar`, `blur-glass-surface` | 12 px, 16 px | same | With `saturate(140%)` |
| `shadow-glass` | lit top edge, soft shadow | same, darker | Glass panels |
| `duration-fast`, `-base`, `-slow` | 150, 200, 300 ms | same | Hover fills, panels, sheets |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | same | Every transition |

### Glass mechanics

- **Solid by default.** `--glass-surface`, `--glass-bar` and `--glass-overlay` resolve to the solid card, background and popover. They turn translucent, with blur, only inside `@supports (backdrop-filter: blur(1px))`.
- **Fallbacks.** Solid when the browser has no `backdrop-filter` (Safari 17 and older), when `prefers-reduced-transparency: reduce` is on, when `index.html` marks the device slow (`navigator.deviceMemory` under 4 GB sets `data-glass="off"` on the root), and in print.
- **Contrast rule.** Text on glass must pass 4.5:1 with the tint composited over pure black (light theme) or pure white (dark theme), whatever is behind it. `src/color.test.ts` checks foreground, muted-foreground and primary on every tint.
- **Colour wash.** `<div className="ambient" aria-hidden />` in `AppShell` and `AuthLayout` draws two fixed radial washes at the top. Text on the washes passes 4.5:1, and the test checks it.
- **No glass on glass.** A control on glass uses `GlassButton` (a transparent outline button with a hover fill), not a second glass layer. Dialogs have no blur of their own, because the shadcn scrim already blurs the page.
- **At most two blurred layers in one view:** the top bar after scroll and one panel. The sidebar has the tint only.
- **Motion.** The glass never animates. The header fill fades in 150 ms when the page scrolls. `motion-reduce` turns transitions off.

### Components

They live in `apps/web/src/common/components/surface/`, not in a `packages/ui` package. The structure rules put reusable non-shadcn components in `common/components`, and the Expo app cannot reuse DOM components, so a package would share nothing that the tokens do not already share.

| Component | Built on | Use |
| - | - | - |
| `GlassSurface` | a `div`, or any element with `asChild` | `layer="bar"`, `"surface"` or `"overlay"`. The phone tab bar uses `layer="bar"`. |
| Sidebar skin | `AppSidebar` | `bg-glass-bar` without a blur. Nothing scrolls under the sidebar, so a blur would cost a filter and change nothing. |
| `GlassCard` | shadcn `Card` | A frame with no result in it: the sign-in card. |
| Glass top bar | `AppHeader` | Clear over the wash at the top. It takes the bar glass and its border after the page scrolls. |
| `GlassDialogContent` | shadcn `DialogContent` | The keyboard shortcuts dialog. |
| `GlassButton` | shadcn `Button`, `outline` | Actions on a glass surface: Compare reports and Export for doctor on the report header. |
| `GlassBadge` | shadcn `Badge`, `outline` | Labels on glass that are not a result. A status always uses `StatusBadge`. |
| `StatTile` | `dt` and `dd` in a `dl` | One number with a label, an optional unit and an optional status mark. Always solid. The dashboard shows the marker counts by status with it. |
| `PageHeader glass` | `GlassSurface` | The report page header. |

`/design` (dev builds only) shows every component in both themes, over a backdrop with content under the glass. "Show the solid fallback" turns glass off for the page, the same way a slow device does.

| Do | Do not |
| - | - |
| `GlassSurface` on a bar, a frame or a dialog | Glass on a card that shows a score, a value, a status or a chart |
| `StatTile` for a count or a value | A translucent status fill, or `bg-optimal/50` |
| `GlassButton` on glass | `GlassCard` inside a `GlassCard` |
| `text-muted-foreground` on glass | A new tint opacity without the contrast test |

### Proof on three screens

Screenshots use the demo account (made-up profile "Arjun Mehta", the two sample reports in `apps/api/fixtures/golden`). Dashboard is a full page, the report and sign in are the first screen. The before shots of the dashboard and the report showed real data, so they are gone.

| Page | Light, 390 px | Light, 1440 px | Dark, 390 px | Dark, 1440 px |
| - | - | - | - | - |
| Dashboard | [after](design/pages/after-v2-dashboard-light-phone.jpg) | [after](design/pages/after-v2-dashboard-light.jpg) | [after](design/pages/after-v2-dashboard-dark-phone.jpg) | [after](design/pages/after-v2-dashboard-dark.jpg) |
| Report header | [after](design/pages/after-v2-report-light-phone.jpg) | [after](design/pages/after-v2-report-light.jpg) | [after](design/pages/after-v2-report-dark-phone.jpg) | [after](design/pages/after-v2-report-dark.jpg) |
| Sign in | [before](design/pages/before-v2-login-light-phone.jpg), [after](design/pages/after-v2-login-light-phone.jpg) | [before](design/pages/before-v2-login-light.jpg), [after](design/pages/after-v2-login-light.jpg) | [before](design/pages/before-v2-login-dark-phone.jpg), [after](design/pages/after-v2-login-dark-phone.jpg) | [before](design/pages/before-v2-login-dark.jpg), [after](design/pages/after-v2-login-dark.jpg) |
| `/design` | | [after](design/pages/after-v2-design-light.jpg) | | [after](design/pages/after-v2-design-dark.jpg) |

At 390 px and 1440 px no page scrolls sideways.

### Measured gates (2026-10-13)

| Gate | Target | Result |
| - | - | - |
| Text on glass | 4.5:1 or better, both themes | Lowest is muted-foreground: 4.82:1 on the bar tint in light, 4.73:1 on the surface tint in dark. Foreground is 9.84:1 or better. `src/color.test.ts` checks every pair. |
| Lighthouse accessibility | 100 on the dashboard, the report page and sign in | 100 on all three, in light and in dark (desktop preset, dev server, Lighthouse 12.8.2). |
| INP, dashboard, 4x CPU throttle | Not worse than before | Light: median 88 ms against 92 ms before (18 runs each). Dark: median 80 ms against 80 ms before (15 runs each). |

How INP was measured: a production build (`vite preview`) at 1440 x 900, Chrome with a 4x CPU throttle. Each run does the same 9 interactions: collapse and expand the sidebar, open and close the profile menu, open and close the user menu, scroll, open and close the shortcuts dialog. INP is the longest interaction of the run (Event Timing). Other work ran on the same 8 GB Mac, so the old and the new build ran in turns, one run each per round, under the same load.

Two changes came from the measurement:

- **Dialogs have no blur of their own.** With a 24 px dialog blur, opening and closing the shortcuts dialog took 120 to 136 ms against about 80 ms before.
- **The sidebar has the glass tint but no blur.** With the blur, dark was 92 ms against 80 ms before (18 runs each). Only the fixed wash sits behind the sidebar, so the blur did not change how it looks. It cost a full-height filter on every frame of the collapse animation and under the dialog scrim.
