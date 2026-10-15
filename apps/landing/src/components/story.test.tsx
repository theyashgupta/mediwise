import { afterEach, expect, test, vi } from "vitest";
import { centredStep, watchSteps } from "./story";

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Builds an observer entry for the story step with the given index.
 */
function step(index: number, isIntersecting: boolean) {
  const target = { dataset: { storyStep: String(index) } } as unknown as HTMLElement;
  return { target, isIntersecting };
}

test("the step that enters the centre line is chosen", () => {
  expect(centredStep([step(2, true)])).toBe(2);
});

test("when one step leaves and the next enters in one callback, the entering step is chosen", () => {
  expect(centredStep([step(1, false), step(2, true)])).toBe(2);
  expect(centredStep([step(3, true), step(2, false)])).toBe(3);
});

test("a callback with only leaving steps keeps the current screen", () => {
  expect(centredStep([step(4, false)])).toBeUndefined();
  expect(centredStep([])).toBeUndefined();
});

test("the step watcher writes the centred step to the container and disconnects on cleanup", () => {
  let callback: (entries: ReturnType<typeof step>[]) => void = () => {};
  let options: IntersectionObserverInit | undefined;
  const observed: unknown[] = [];
  let disconnected = false;
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: typeof callback, init: IntersectionObserverInit) {
        callback = cb;
        options = init;
      }
      observe(element: unknown) {
        observed.push(element);
      }
      disconnect() {
        disconnected = true;
      }
    },
  );
  const steps = [0, 1, 2].map((index) => step(index, false).target);
  const container = {
    dataset: { step: "0" },
    querySelectorAll: () => steps,
  } as unknown as HTMLElement;

  const stop = watchSteps(container);
  expect(observed).toEqual(steps);
  expect(options?.rootMargin).toBe("-49% 0px -49% 0px");
  callback([step(0, false), step(1, true)]);
  expect(container.dataset.step).toBe("1");
  callback([step(1, false)]);
  expect(container.dataset.step).toBe("1");
  stop();
  expect(disconnected).toBe(true);
});
