import { expect, test } from "vitest";
import { checkSize, photoFlags, photoWarnings } from "./photo-check";

function image(width: number, height: number, pixel: (x: number, y: number) => number) {
  const size = checkSize(width, height);
  return Array.from({ length: size.width * size.height }, (_, i) =>
    pixel(i % size.width, Math.floor(i / size.width)),
  );
}

const checkerboard = (x: number, y: number) => ((Math.floor(x / 8) + Math.floor(y / 8)) % 2) * 255;

test("a sharp checkerboard gives no flag", () => {
  expect(photoFlags(3000, 4000, image(3000, 4000, checkerboard))).toEqual({
    small: false,
    dark: false,
    blurred: false,
  });
});

test("a flat grey image gives blurred", () => {
  expect(
    photoFlags(
      3000,
      4000,
      image(3000, 4000, () => 128),
    ),
  ).toEqual({
    small: false,
    dark: false,
    blurred: true,
  });
});

test("a black image gives dark", () => {
  expect(
    photoFlags(
      3000,
      4000,
      image(3000, 4000, () => 0),
    ),
  ).toEqual({
    small: false,
    dark: true,
    blurred: false,
  });
});

test("an 800 x 600 photo gives small", () => {
  expect(photoFlags(800, 600, image(800, 600, checkerboard))).toEqual({
    small: true,
    dark: false,
    blurred: false,
  });
});

test("the check copy is 512 px on the long side and never larger than the photo", () => {
  expect(checkSize(3000, 4000)).toEqual({ width: 384, height: 512 });
  expect(checkSize(300, 200)).toEqual({ width: 300, height: 200 });
});

test("each flag gives one warning, small first and blurred last", () => {
  expect(photoWarnings({ small: true, dark: true, blurred: true })).toEqual([
    "This photo is small. Take it again closer to the page.",
    "This photo is dark. Take it again in good light.",
    "This photo is blurred. Hold the phone still and take it again.",
  ]);
  expect(photoWarnings({ small: false, dark: false, blurred: false })).toEqual([]);
  expect(photoWarnings(undefined)).toEqual([]);
});
