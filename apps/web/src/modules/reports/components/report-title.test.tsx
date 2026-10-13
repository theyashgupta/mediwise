import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ReportTitle } from "./report-title";

const idle = { saving: false, failed: false, onSave: () => {} };
const title = "1 to 11 Feb 2025 · blood panel (46 markers), ultrasound x2";

test("the title shows as the page heading with a rename button", () => {
  const html = renderToStaticMarkup(<ReportTitle {...idle} title={title} edited={false} />);
  expect(html).toContain(`>${title}</h1>`);
  expect(html).toContain("Rename");
});

test("the rename field holds the title, keeps it to 60 characters and counts them", () => {
  const html = renderToStaticMarkup(
    <ReportTitle {...idle} title="My scans" edited={false} defaultEditing />,
  );
  expect(html).toContain('value="My scans"');
  expect(html).toContain('maxLength="60"');
  expect(html).toContain("8 of 60 characters");
  expect(html).not.toContain("Use the title MediWise made");
});

test("a title the user wrote can go back to the title MediWise made", () => {
  const html = renderToStaticMarkup(
    <ReportTitle {...idle} title="My scans" edited defaultEditing />,
  );
  expect(html).toContain("Use the title MediWise made");
});

test("a failed save shows the error under the heading", () => {
  const html = renderToStaticMarkup(<ReportTitle {...idle} title={title} edited={false} failed />);
  expect(html).toContain("We could not save the title. Try again.");
});
