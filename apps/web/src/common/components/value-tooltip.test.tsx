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
