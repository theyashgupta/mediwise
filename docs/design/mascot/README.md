# MediWise mascot

The mascot is a small character for the Ask feature. It shows what the assistant does at this time: it waits, it listens, it thinks or it talks.

## The pick

The product owner picked **line-drop** from three candidates (2026-10-15). The source is `candidates/line-drop.svg`. The sheet `candidates/line-drop.png` shows the four states at 96 px and 48 px in the light and dark themes.

- The body is the MediWise droplet from the logo, with a teal outline and a soft teal fill.
- The face has two dot eyes and a small smile. One shine stroke on the upper left shows that the droplet is water.
- The outline uses the same line weight as the app icons, so the mascot looks correct next to chat text.

The two other candidates stay in `candidates/` for reference. Do not use them in the app.

To render the sheets again, serve `candidates/` over HTTP and open `sheet.html?mark=<name>`.

## Component

`Mascot` is in `apps/web/src/modules/mascot`. Import it from `@/modules/mascot`.

```tsx
<Mascot state="thinking" size={48} />
```

| Prop        | Values                                         | Default  |
| ----------- | ---------------------------------------------- | -------- |
| `state`     | `idle`, `listening`, `thinking`, `talking`     | `idle`   |
| `size`      | the width and height in px                     | `48`     |
| `className` | extra classes, for example `md:size-24`        | none     |

## States

| State       | Pose                                  | Motion                                    |
| ----------- | ------------------------------------- | ----------------------------------------- |
| `idle`      | smile                                 | slow breath, a blink every 4 s            |
| `listening` | leans in to the left, eyes open wider | blink                                     |
| `thinking`  | eyes look up, small smile at the side | eyes move left and right, small bob       |
| `talking`   | open mouth                            | mouth opens and closes, blink             |

The mascot also has a short entrance when it first appears: it fades in and moves up in 400 ms.

A change of state moves the parts to the new pose in 300 ms.

## Motion and reduced motion

- All motion is CSS and SVG. There is no Lottie file, no raster image and no new dependency.
- The keyframes are in `apps/web/src/styles/globals.css` as `--animate-mascot-*` theme values.
- Every animation and transition class has the `motion-safe:` prefix. When the user sets reduced motion, the mascot shows the static pose of each state and does not move.
- The test `mascot.test.tsx` fails when a motion class has no `motion-safe:` prefix.

## Usage rules

1. Use the mascot only on the Ask feature and in the design-system gallery (`/design`, development builds only).
2. Use 48 px on a phone and 96 px on a desktop. Do not use it smaller than 32 px, because the face is then not clear.
3. Show one mascot on a screen at a time.
4. Set the state from what the assistant does. Do not use a state for decoration.
5. Keep the mascot hidden from screen readers (it has `aria-hidden`). Show the status of the assistant in text.
6. Use the colour tokens only: `primary` for the outline, `--ambient-1` for the fill and `foreground` for the face. Do not hard-code a colour.
7. Do not add a cross, a caduceus or any other medical symbol to the mascot.
8. Do not give the mascot a facial expression that shows a result (for example, a sad face for a risk marker). The mascot shows the assistant, not the health of the user.

## Screenshots

- `gallery-1440.png`: the gallery entry at 1440 px, light and dark.
- `gallery-390.png`: the gallery entry at 390 px.
