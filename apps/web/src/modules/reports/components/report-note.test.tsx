import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { ReportNote } from "./report-note";

const idle = { saving: false, saved: false, failed: false, onSave: () => {} };

test("the note field shows its label, the privacy line, the saved note and a 1,000 character limit", () => {
  const html = renderToStaticMarkup(<ReportNote {...idle} note="Started walking daily." />);
  expect(html).toContain("Notes for this visit");
  expect(html).toContain("MediWise does not read this note. Your doctor sees it on the export.");
  expect(html).toContain("Started walking daily.</textarea>");
  expect(html).toContain('maxLength="1000"');
  expect(html).toContain("22 of 1,000 characters");
});

test("a note saved in this visit to the page shows Saved", () => {
  expect(renderToStaticMarkup(<ReportNote {...idle} note="Hi" saved />)).toContain(">Saved</p>");
});
