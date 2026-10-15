/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Mascot, type MascotState } from "./mascot";

afterEach(cleanup);

const states: MascotState[] = ["idle", "listening", "thinking", "talking"];

test("the mascot draws at the size it is given and stays hidden from screen readers", () => {
  const { container } = render(<Mascot size={96} />);
  const svg = container.querySelector("svg");
  expect(svg?.getAttribute("width")).toBe("96");
  expect(svg?.getAttribute("height")).toBe("96");
  expect(svg?.getAttribute("aria-hidden")).toBe("true");
});

test.each(states)("the %s state moves only when the user allows motion", (state) => {
  const { container } = render(<Mascot state={state} />);
  expect(container.querySelector("svg")?.dataset.state).toBe(state);
  const classes = [...container.querySelectorAll("[class]")].flatMap((el) =>
    (el.getAttribute("class") ?? "").split(" "),
  );
  const motion = classes.filter((c) => /(^|:)(animate|transition)-/.test(c));
  expect(motion.length).toBeGreaterThan(0);
  expect(motion.filter((c) => !c.startsWith("motion-safe:"))).toEqual([]);
});
