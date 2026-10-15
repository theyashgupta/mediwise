/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import { useScrollingDown } from "./use-scrolling-down";

/** Moves the page to `y` and fires the scroll event. */
function scrollTo(y: number) {
  act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event("scroll"));
  });
}

test("scrolling down sets it, scrolling up or to the top clears it, and a small step changes nothing", () => {
  scrollTo(0);
  const { result } = renderHook(() => useScrollingDown());
  expect(result.current).toBe(false);

  scrollTo(300);
  expect(result.current).toBe(true);
  scrollTo(296);
  expect(result.current).toBe(true);
  scrollTo(200);
  expect(result.current).toBe(false);
  scrollTo(204);
  expect(result.current).toBe(false);
  scrollTo(400);
  expect(result.current).toBe(true);
  scrollTo(0);
  expect(result.current).toBe(false);
});

test("a scroll step that comes with a taller page, as when rows above the view render, changes nothing", () => {
  const setHeight = (height: number) =>
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: height,
    });
  setHeight(2000);
  scrollTo(0);
  const { result } = renderHook(() => useScrollingDown());
  scrollTo(600);
  scrollTo(500);
  expect(result.current).toBe(false);

  setHeight(2060);
  scrollTo(560);
  expect(result.current).toBe(false);
  scrollTo(700);
  expect(result.current).toBe(true);
});
