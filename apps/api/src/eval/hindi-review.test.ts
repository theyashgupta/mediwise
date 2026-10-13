import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "vitest";
import { derived, hindiReviewMarkdown, markers, studyMarkers } from "@mediwise/engine";

const file = new URL("../../../../docs/review/hindi-catalog.md", import.meta.url);

test("the committed Hindi review list matches the Hindi catalog", () => {
  const markdown = hindiReviewMarkdown();
  if (process.env.UPDATE_REVIEW) writeFileSync(file, markdown);
  expect(readFileSync(file, "utf8")).toBe(markdown);
});

test("the Hindi review list has a checkbox for every marker", () => {
  const markdown = hindiReviewMarkdown();
  for (const entry of [...markers, ...derived, ...studyMarkers]) {
    expect(markdown, entry.key).toContain(`### ${entry.key}\n\n- [ ] ${entry.name}`);
  }
});
