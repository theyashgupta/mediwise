import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { SettledList } from "./settled-list";

const line = "A 4.2 x 3.1 cm complex mass in the right adnexa.";

test("a settled alert shows both dates, both printed lines and the report that settles it", () => {
  const html = renderToStaticMarkup(
    <SettledList
      items={[
        {
          kind: "study_alert",
          title: `Your ultrasound report says: "${line}"`,
          state: "settled",
          earlier: { reportId: "a", date: "2025-02-10", labName: null, text: line },
          later: {
            reportId: "b",
            date: "2025-03-24",
            labName: null,
            text: "No adnexal mass is seen.",
          },
        },
      ]}
    />,
  );
  expect(html).toContain("Settled");
  expect(html).toContain(line);
  expect(html).toContain("No adnexal mass is seen.");
  expect(html.indexOf("10 Feb 2025")).toBeLessThan(html.indexOf("24 Mar 2025"));
  expect(html).toContain("Settled by the report of 24 Mar 2025.");
  expect(html).not.toMatch(/false positive/i);
});

test("the settling line names the lab of the later study, so two reports of one date stay distinct", () => {
  const html = renderToStaticMarkup(
    <SettledList
      items={[
        {
          kind: "study_alert",
          title: `Your ultrasound report says: "${line}"`,
          state: "settled",
          earlier: { reportId: "a", date: "2025-02-01", labName: "Lakeview Imaging", text: line },
          later: {
            reportId: "b",
            date: "2025-02-11",
            labName: "Hillside Scan Centre",
            text: "No adnexal mass is seen.",
          },
        },
      ]}
    />,
  );
  expect(html).toContain("11 Feb 2025, Hillside Scan Centre");
  expect(html).toContain("Settled by the Hillside Scan Centre report of 11 Feb 2025.");
});

test("no settled finding renders nothing", () => {
  expect(renderToStaticMarkup(<SettledList items={[]} />)).toBe("");
});
