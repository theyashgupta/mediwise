# Component layer: research and decisions (MEDI-191)

2026-11-12. The maintainer said that the buttons, selects and text inputs look like stock shadcn, and that the corners look AI-generated. This document records what the app uses today, what four refined systems do, and one decision for each topic. PRD-2 applies the layer to every page.

## Verdict

- **Radius:** a named scale of control 12 px, card 16 px, sheet 24 px. The Tailwind steps move up with it, so every shadcn primitive gets the rounder scale. The maintainer compared it with a 10, 14, 20 scale on 2026-11-12 and picked this one.
- **Control heights:** 32, 40 and 48 px, and 44 px for a touch target under `md`. Buttons, inputs and selects share the heights, so a row of controls lines up.
- **Focus ring:** a solid 2 px outline in `--ring` with a 2 px offset, on every control.
- **Colour:** one theme, teal and warm stone. `--input` becomes the 3:1 control edge. Two new roles: `field` (control fill) and `primary-hover`.
- **Variants:** Button has primary, secondary, outline, ghost, destructive and link, in sizes sm, md and lg, with a loading state. IconButton, Input, Textarea, Select and Field complete the set.

## What the app uses today

The sweep of 2026-11-12 (`apps/e2e/sweep`, 25 pages, 390 and 1280 px, light and dark, `docs/design/pages/before-medi-191-*`) counted these controls at 1280 px, light, at first render.

| Page | Buttons | Inputs | Selects | Badges | Cards | Menus | Other |
| - | - | - | - | - | - | - | - |
| Home | 12 | 0 | 0 | 31 | 0 | 3 | 2 native buttons |
| Report | 19 | 1 | 3 | 193 | 0 | 5 | 4 labels, 3 native selects |
| Trends | 27 | 0 | 0 | 14 | 0 | 3 | |
| Compare | 2 | 0 | 2 | 216 | 0 | 3 | 2 labels |
| Settings | 7 | 1 | 2 | 0 | 0 | 3 | 3 labels, more after lazy sections |
| Profiles | 9 | 0 | 0 | 0 | 0 | 3 | |
| Credits | 5 | 0 | 0 | 0 | 3 | 3 | |
| Upload | 2 | 0 | 0 | 0 | 0 | 4 | 2 native inputs (file) |
| Year review | 2 | 0 | 0 | 16 | 0 | 3 | |
| Sign in, sign up | 2 | 0 | 1 | 0 | 1 | 0 | the form step shows its inputs after the email step |
| Kitchen sink | 43 | 6 | 2 | 16 | 2 | 7 | 6 tabs, 2 sheets, 2 dialogs |

The other pages (marker, trend, export, reports, ask, admin, the legal pages, forgot and reset password) hold 0 to 2 buttons each. The sweep skipped the share page (it needs a share token, and the sweep never makes one) and the episode page (the demo profile Arjun Mehta has no episode).

Today's values:

| Control | Height | Radius | Focus |
| - | - | - | - |
| Button (shadcn vega, hand-edited) | 36 px | 8 px (`rounded-lg`) | 3 px ring, `--ring` at 50% |
| Input, Textarea, Select trigger | 36 px | 6 px (`rounded-md`) | same |
| Card | | 12 px (`rounded-xl`) | |

Measured with `packages/design-tokens/src/color.ts`:

| Pair | Light | Dark | Needed |
| - | - | - | - |
| Focus ring (50% alpha) on card | 1.90:1 | 2.50:1 | 3:1 (WCAG 1.4.11) |
| Focus ring (solid) on card / background | 4.08 / 3.94 | 6.08 / 6.44 | 3:1 |
| Input border on card | 1.47:1 | 1.49:1 | 3:1 when the edge identifies the control |

The ring fails today in both themes, and the input edge is close to invisible on a card.

## Systems studied

| System | Control height | Radius | Focus | Source |
| - | - | - | - | - |
| Radix Themes | 24, 32, 40, 48 (sizes 1 to 4) | scale 3, 4, 6, 8, 12, 16; "large" is 1.5 times | 2 px solid accent, offset 2 px on solid buttons | `radix-ui/themes` `radius.css`, `base-button.css` |
| Vercel (brand CSS) | 36, and 44 under 800 px | 6 px button, 8 px base | 2 px solid, offset 3 px | `vercel.com/geist/vercel-brand.css` (indicative, not the Geist component spec) |
| tweakcn presets | | `--radius` mode 0.5rem (16 of 37). Rounder: Tangerine 0.75rem, Claymorphism 1.25rem | | `jnsahaj/tweakcn` `theme-presets.ts` |
| Linear | unconfirmed (third-party: 28 to 32) | unconfirmed (6 to 8) | unconfirmed | no primary source |
| Origin UI / coss | unconfirmed | unconfirmed | | source paths returned 404 |

What we take from them:

- **The stock look is 8 px on 36 px.** tweakcn's most common preset is 0.5rem, which is the value the app has now. A 12 px radius on a 40 px control reads as one deliberate shape, not a default.
- **Rounder is not pill.** Radix "large" multiplies the scale by 1.5. Our 12, 16, 24 sits just above that level. Pills stay for badges and the avatar only.
- **A solid ring with an offset** is what Radix and Vercel do, and it is what WCAG 2.4.13 names as the simplest pass.
- **Nested radius:** outer radius equals inner radius plus the gap (jakub.kr, "concentric border radius"). A 16 px card with controls 4 px inside would need 12 px controls. Our cards have 24 px padding, so the rule does not bind there, but a menu (popover 16 px, item padding 4 px) gets 12 px items.

## Decisions

### Radius scale

| Role | Value | Tailwind | Use |
| - | - | - | - |
| Control | 12 px | `rounded-lg` | Button, IconButton, Input, Select trigger, Textarea, menu items |
| Card | 16 px | `rounded-xl` | Card, panel, popover, select list, empty state |
| Sheet | 24 px | `rounded-2xl` | Dialog, sheet, the phone tab bar |
| `--radius` (base) | 12 px | | shadcn reads it |

The Tailwind steps move with the scale: `sm` 8, `md` 10, `lg` 12, `xl` 16, `2xl` 24. A primitive that uses `rounded-lg` or `rounded-xl` gets the control or card radius with no edit. Badges and avatars keep `rounded-full`. There are no named aliases such as `rounded-control`: `cn` merges only Tailwind's own names, and a caller's `rounded-md` must replace the control radius, not sit next to it.

### Control heights

| Role | Value | Tailwind | Use |
| - | - | - | - |
| Small | 32 px | `h-8` | Dense rows, table tools, filters |
| Default | 40 px | `h-10` | Default for every button, input and select |
| Large | 48 px | `h-12` | One main action on a page: Read my report, Sign in |
| Touch | 44 px | `size-11` | Minimum target under `md` for IconButton (the MEDI-170 rule) |

Text is 14 px (`text-sm`) in sm and md, and 15 px (`text-base`) in lg. Inputs use 16 px text under `md`, so iOS does not zoom on focus.

### Focus ring

- `outline: 2px solid var(--ring)`, `outline-offset: 2px`, on `:focus-visible` only. The same rule applies to every control.
- `--ring` keeps its value. Solid, it passes 3:1 on every surface: 3.94:1 at the lowest (light, on the background).
- A control in error keeps the same ring and shows its red edge, so focus never changes colour.

### Colour roles

The palette stays teal (hue 195) and warm stone (hue 70 to 80). No new hue.

| Role | Light | Dark | Measured | Use |
| - | - | - | - | - |
| `input` (changed) | `oklch(0.64 0.008 70)` | `oklch(0.54 0.006 70)` | 3.34:1 on card in light and in dark | Edge of inputs, selects, textareas, checkboxes, switches |
| `field` (new) | `card` | `oklch(0.25 0.004 70)` | `input` edge on it: 3.34:1 light, 3.16:1 dark | Fill of inputs, selects and textareas |
| `primary-hover` (new) | `oklch(0.43 0.072 195)` | `oklch(0.83 0.075 195)` | 7.60:1 light, 10.93:1 dark for the button text | Primary button hover |
| `ring` | unchanged | unchanged | 3.94:1 or higher, solid | Focus |
| `border` | unchanged | unchanged | | Cards, dividers, outline button edge |

Every pair goes into `color.test.ts`, so a later change cannot drop it below the line.

### Variant set

| Control | Variants | Sizes | States |
| - | - | - | - |
| Button | primary (teal fill), secondary (stone fill), outline (card fill, `border` edge), ghost, destructive (red text on a soft red fill, red edge), link | sm, md, lg | hover, active (1 px press), disabled, loading |
| IconButton | the Button variants, ghost by default | sm, md (44 px under `md`) | needs a `label`, which is the `aria-label` and the tooltip |
| Input | one | sm, md, lg | invalid, disabled |
| Textarea | one | grows with content, min 96 px | invalid, disabled |
| Select | one trigger, the shadcn list | sm, md | invalid, disabled |
| Field | label, control, hint, error | | links the hint and the error to the control with `aria-describedby`, sets `aria-invalid` |

Rules that make it ours, not stock:

- **Weight 500, not 600,** on button labels. It reads calmer next to Instrument Serif headings.
- **The primary button has a lit top edge** (`--shadow-control`), and it presses down 1 px. Other variants are flat.
- **Fields sit on their own fill** with a 3:1 edge. On hover the edge darkens, and on focus it turns teal and gets the ring.
- **Destructive is never solid red.** A delete must not look like a lab result (DESIGN.md palette rule).
- **Loading** keeps the width. The label fades out and a spinner takes its place, but screen readers still read the label. `aria-busy` is set, the button ignores presses, and it keeps full opacity, so it does not look disabled.

### How the layer wraps shadcn

- Select and Field wrap the shadcn primitives (Radix Select root, list and items, the shadcn `field` label, description and error). Select owns its trigger, built on the Radix trigger.
- Button, Input and Textarea in shadcn are class strings on a native element. The layer renders the same element (Button through the Radix `Slot`, as shadcn does) with its own classes, so no shadcn class has to be overridden one by one.
- The focus ring needs `outline-solid` next to `outline-2`: in Tailwind v4, the base `outline-none` sets the outline style to none for every later outline class.

## What is not in this decision

- Checkbox, switch, tabs, badge, card and dialog get the new tokens only, with no wrapper.
- The landing page keeps its own styles.
- PRD-2 moves every page onto the layer, maps the hard-coded `rounded-*` classes, and adds the lint rule.
