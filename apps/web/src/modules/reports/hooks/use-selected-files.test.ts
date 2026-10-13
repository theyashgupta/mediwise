import { expect, test } from "vitest";
import { fileErrors, toReportFile } from "./use-selected-files";

const mb = 1024 * 1024;
const file = (name: string, type: string, size = mb) =>
  new File([new Uint8Array(size)], name, { type });

test("a HEIC photo with an empty browser type is sent as image/heic", () => {
  expect(toReportFile(file("IMG_1.HEIC", "")).mime).toBe("image/heic");
});

test("PDFs and photos in one upload have no errors", () => {
  expect(fileErrors([file("a.pdf", "application/pdf")])).toEqual([]);
  expect(
    fileErrors([
      file("a.pdf", "application/pdf"),
      file("b.pdf", "application/pdf"),
      file("c.jpg", "image/jpeg"),
    ]),
  ).toEqual([]);
});

test("too many files, a large file and a wrong type each get one message", () => {
  expect(fileErrors(Array.from({ length: 21 }, () => file("a.jpg", "image/jpeg", 10)))).toEqual([
    "Upload up to 20 files",
  ]);
  expect(fileErrors([file("big.pdf", "application/pdf", 30 * mb)])).toEqual([
    "big.pdf is larger than 25 MB",
  ]);
  expect(fileErrors([file("a.gif", "image/gif"), file("b.gif", "image/gif")])).toEqual([
    "Upload a PDF or photos in JPEG, PNG, HEIC or WebP",
  ]);
});
