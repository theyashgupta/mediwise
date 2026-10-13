import { expect, test } from "vitest";
import { fileKind, megabytes } from "./files";

test("the type decides the kind when the browser gives one", () => {
  expect(fileKind("scan", "application/pdf")).toBe("pdf");
  expect(fileKind("photo", "image/png")).toBe("png");
});

test("the extension decides the kind when the type is empty", () => {
  expect(fileKind("IMG_0001.HEIC")).toBe("heic");
  expect(fileKind("lab-a.pdf")).toBe("pdf");
});

test("a WebP photo keeps its own kind", () => {
  expect(fileKind("photo.webp")).toBe("webp");
});

test("a byte count reads in megabytes with one decimal", () => {
  expect(megabytes(25 * 1024 * 1024)).toBe("25.0");
  expect(megabytes(1_300_000)).toBe("1.2");
});

test("any other image reads as a jpg", () => {
  expect(fileKind("film.jpeg", "image/jpeg")).toBe("jpg");
});
