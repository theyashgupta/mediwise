import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { composite, contrast, type OklchColor, type Rgb, toSrgb } from "./color.ts";

type Theme = "light" | "dark";
type ColorToken = { $value: OklchColor | string };

const { color } = JSON.parse(
  readFileSync(new URL("../tokens/color.json", import.meta.url), "utf8"),
) as { color: Record<Theme, Record<string, ColorToken>> };

/**
 * Returns a colour token of one theme, following a `{color.<theme>.<name>}` reference.
 */
function token(theme: Theme, name: string): OklchColor {
  const value = color[theme][name]?.$value;
  if (!value) throw new Error(`color.${theme}.${name} is missing`);
  return typeof value === "string" ? token(theme, value.split(".").at(-1)!.slice(0, -1)) : value;
}

const themes: Theme[] = ["light", "dark"];
const surfaces = ["background", "card", "popover", "muted", "sidebar", "ambient-1", "ambient-2"];
const textOnSurfaces: [string, string][] = [
  ...["foreground", "muted-foreground", "primary", "destructive"].flatMap((text) =>
    surfaces.map((surface): [string, string] => [text, surface]),
  ),
  ["primary-foreground", "primary"],
  ...["optimal", "watch", "risk", "unknown"].flatMap((status): [string, string][] => [
    [status, `${status}-soft`],
    [status, "background"],
    [status, "card"],
  ]),
];

test.each(themes)("every text token passes 4.5:1 on its surfaces in %s", (theme) => {
  const failures = textOnSurfaces
    .map(([text, surface]) => {
      const ratio = contrast(toSrgb(token(theme, text)), toSrgb(token(theme, surface)));
      return ratio < 4.5 ? `${text} on ${surface}: ${ratio.toFixed(2)}` : undefined;
    })
    .filter(Boolean);
  expect(failures).toEqual([]);
});

const worstBackdrop: Record<Theme, Rgb> = { light: [0, 0, 0], dark: [1, 1, 1] };
const glassTints = ["glass-tint-surface", "glass-tint-bar", "glass-tint-overlay"];

test.each(themes)(
  "text on every glass tint passes 4.5:1 over the worst backdrop in %s",
  (theme) => {
    const failures = glassTints.flatMap((tint) =>
      ["foreground", "muted-foreground", "primary"]
        .map((text) => {
          const glass = composite(token(theme, tint), worstBackdrop[theme]);
          const ratio = contrast(toSrgb(token(theme, text)), glass);
          return ratio < 4.5 ? `${text} on ${tint}: ${ratio.toFixed(2)}` : undefined;
        })
        .filter(Boolean),
    );
    expect(failures).toEqual([]);
  },
);

test.each(themes)("result and status colours are opaque in %s", (theme) => {
  const statuses = ["optimal", "watch", "risk", "unknown"].flatMap((s) => [s, `${s}-soft`]);
  const translucent = statuses.filter((name) => token(theme, name).alpha !== undefined);
  expect(translucent).toEqual([]);
});
