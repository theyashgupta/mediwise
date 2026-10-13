import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ValueTooltip } from "./value-tooltip";

const lab = {
  name: "Made-up Diagnostics",
  range: { low: null, high: 100 },
  optimalRange: { low: 50, high: 90 },
  change: true,
};

test("the tooltip shows the lab name, the lab range and the optimal range", () => {
  const html = renderToStaticMarkup(
    <ValueTooltip date="10 Jul 2025" value="120" lab={lab} unit="mg/dL" />,
  );
  expect(html).toContain("10 Jul 2025");
  expect(html).toContain("120 mg/dL");
  expect(html).toContain("Made-up Diagnostics");
  expect(html).toContain("below 100 mg/dL");
  expect(html).toContain("50 to 90 mg/dL");
  expect(html).toContain("The lab changed at this result.");
});

test("a result without a lab name or ranges says so, and a result from the same lab has no change line", () => {
  const html = renderToStaticMarkup(
    <ValueTooltip
      date="10 Jan 2025"
      value="160"
      lab={{ name: null, range: null, optimalRange: null, change: false }}
    />,
  );
  expect(html).toContain("Not printed");
  expect(html).toContain("None");
  expect(html).not.toContain("The lab changed");
});

test("a day with two reports lists the other value and its lab under the shown value", () => {
  const html = renderToStaticMarkup(
    <ValueTooltip
      date="6 Oct 2026"
      value="104"
      lab={lab}
      sameDay={[{ value: "98", labName: "Second Lab" }]}
      unit="mg/dL"
    />,
  );
  expect(html).toContain("Other values on this day");
  expect(html).toContain("98 mg/dL");
  expect(html).toContain("Second Lab");
});

test("a point without lab details shows the date and the value only", () => {
  const html = renderToStaticMarkup(<ValueTooltip date="6 Oct 2026" value="104" unit="mg/dL" />);
  expect(html).toContain("104 mg/dL");
  expect(html).not.toContain("Lab");
});

test("a point inside an episode names the episode, a point outside has no episode row", () => {
  const inside = renderToStaticMarkup(
    <ValueTooltip date="10 Feb 2025" value="3.9" lab={lab} episode="Thyroid tests" />,
  );
  const outside = renderToStaticMarkup(<ValueTooltip date="10 Sep 2024" value="2.1" lab={lab} />);
  expect(inside).toContain("Episode");
  expect(inside).toContain("Thyroid tests");
  expect(outside).not.toContain("Episode");
});
