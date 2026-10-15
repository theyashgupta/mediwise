import { afterEach, expect, test, vi } from "vitest";
import { formatTicker, revealEntries, watchMotion } from "./motion";

afterEach(() => {
  vi.unstubAllGlobals();
});

const viewportBottom = 900;

/**
 * Builds a reveal entry for an element whose top edge sits at `top`.
 */
function entry(top: number, isIntersecting: boolean, reveal = "") {
  const target = { dataset: { reveal } } as unknown as HTMLElement;
  return { target, isIntersecting, boundingClientRect: { top } as DOMRectReadOnly };
}

/**
 * Runs the reveal callback on one entry and returns the element state and whether it is still watched.
 */
function run(top: number, isIntersecting: boolean, reveal = "") {
  const item = entry(top, isIntersecting, reveal);
  const unobserved: Element[] = [];
  revealEntries([item], { unobserve: (element) => unobserved.push(element) }, viewportBottom);
  return { reveal: item.target.dataset.reveal, watched: unobserved.length === 0 };
}

test("an element below the viewport is hidden and stays watched", () => {
  expect(run(1200, false)).toEqual({ reveal: "hidden", watched: true });
});

test("an element whose top sits exactly on the viewport bottom is hidden", () => {
  expect(run(900, false)).toEqual({ reveal: "hidden", watched: true });
});

test("a hidden element that scrolls in is shown and no longer watched", () => {
  expect(run(600, true, "hidden")).toEqual({ reveal: "shown", watched: false });
});

test("an element inside the viewport at load stays visible and is not watched again", () => {
  expect(run(300, true)).toEqual({ reveal: "shown", watched: false });
});

test("an element above the viewport at load stays visible", () => {
  expect(run(-500, false)).toEqual({ reveal: "shown", watched: false });
});

/**
 * Replaces the browser globals the motion watcher uses with recorders.
 */
function stubBrowser() {
  const observers: { observed: Element[]; disconnected: boolean }[] = [];
  const listeners = new Map<string, () => void>();
  const hero = { dataset: {} as Record<string, string> };
  const root = { dataset: {} as Record<string, string> };
  const revealElements = [{ id: "a" }, { id: "b" }];
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      record = { observed: [] as Element[], disconnected: false };
      constructor() {
        observers.push(this.record);
      }
      observe(element: Element) {
        this.record.observed.push(element);
      }
      unobserve() {}
      disconnect() {
        this.record.disconnected = true;
      }
    },
  );
  vi.stubGlobal("document", {
    documentElement: root,
    visibilityState: "hidden",
    querySelectorAll: (selector: string) =>
      selector === '[data-reveal]:not([data-reveal="shown"])' ? revealElements : [],
    getElementById: (id: string) => (id === "top" ? hero : null),
    addEventListener: (type: string, listener: () => void) => listeners.set(type, listener),
    removeEventListener: (type: string) => listeners.delete(type),
  });
  return { observers, listeners, root, revealElements, hero };
}

test("the watcher observes every reveal element and the hero, and stops on cleanup", () => {
  const browser = stubBrowser();
  const stop = watchMotion();
  expect(browser.observers.map((observer) => observer.observed)).toEqual([
    browser.revealElements,
    [browser.hero],
  ]);
  expect(browser.root.dataset.tab).toBe("hidden");
  browser.listeners.get("visibilitychange")?.();
  expect(browser.root.dataset.tab).toBe("hidden");
  stop();
  expect(browser.observers.every((observer) => observer.disconnected)).toBe(true);
  expect(browser.listeners.size).toBe(0);
});

test("the ticker writes Indian digit grouping, fixed decimals and the prefix", () => {
  expect(formatTicker(137, 0)).toBe("137");
  expect(formatTicker(123456, 0)).toBe("1,23,456");
  expect(formatTicker(29.95, 2, "₹")).toBe("₹29.95");
  expect(formatTicker(29.9, 2, "₹")).toBe("₹29.90");
});
