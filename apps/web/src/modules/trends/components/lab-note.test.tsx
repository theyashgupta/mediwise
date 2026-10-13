import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { LabNote } from "./lab-note";

test("a series from two or more labs shows the lab note", () => {
  expect(renderToStaticMarkup(<LabNote labCount={2} />)).toContain(
    "This chart has results from 2 labs. Ranges can differ by lab.",
  );
});

test("a series from one lab, or with no lab name, shows no note", () => {
  expect(renderToStaticMarkup(<LabNote labCount={1} />)).toBe("");
  expect(renderToStaticMarkup(<LabNote labCount={0} />)).toBe("");
});
