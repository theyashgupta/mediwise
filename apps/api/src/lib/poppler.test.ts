import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { expect, test } from "vitest";
import { compactPageTexts, pdfPageTexts, renderPdfHeader, renderPdfPage } from "./poppler.js";

const twoPages = () => readFile(new URL("../../fixtures/two-pages.pdf", import.meta.url));

test("a page with a text layer returns its text and a page without one returns null", async () => {
  const pages = await pdfPageTexts(await twoPages());

  expect(pages).toHaveLength(2);
  expect(pages?.[0]).toMatch(/Haemoglobin\s+13\.5\s+g\/dL\s+13 - 17/);
  expect(pages?.[1]).toBeNull();
});

test("a file pdftotext cannot read returns undefined", async () => {
  expect(await pdfPageTexts(Buffer.from("%PDF-1.7 damaged"))).toBeUndefined();
});

test("a page renders as a JPEG", async () => {
  const image = await renderPdfPage(await twoPages(), 1);

  expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
});

test("the header of page 1 renders as an 800 by 200 JPEG", async () => {
  const image = await renderPdfHeader(await twoPages());

  expect(await sharp(image).metadata()).toMatchObject({ format: "jpeg", width: 800, height: 200 });
});

test("a long line repeated on three pages stays once, and short headings and column spacing survive", () => {
  const header = "Patient Name : Asha Verma   Collected : 10/Mar/2024";
  const pages = [
    `${header}\nUrine Examination\n  Protein        Absent`,
    `${header}\nUrine Examination\n  Glucose        Absent`,
    `${header}\nUrine Examination\n  Ketones        Absent\n\n`,
  ];

  expect(compactPageTexts(pages)).toEqual([
    `${header}\nUrine Examination\n  Protein        Absent`,
    "Urine Examination\n  Glucose        Absent",
    "Urine Examination\n  Ketones        Absent",
  ]);
});
