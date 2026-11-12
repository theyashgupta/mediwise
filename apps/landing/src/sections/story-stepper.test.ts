import { afterEach, expect, test, vi } from "vitest";
import { scheduleNext, stepMs } from "./story-stepper";

afterEach(() => {
  vi.useRealTimers();
});

test("a step moves to the next one after 4.5 seconds and not before", () => {
  vi.useFakeTimers();
  const go = vi.fn();
  scheduleNext(1, 6, go);
  expect(stepMs).toBe(4500);
  vi.advanceTimersByTime(stepMs - 1);
  expect(go).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(go).toHaveBeenCalledWith(2);
});

test("the last step moves back to the first", () => {
  vi.useFakeTimers();
  const go = vi.fn();
  scheduleNext(5, 6, go);
  vi.advanceTimersByTime(stepMs);
  expect(go).toHaveBeenCalledWith(0);
});

test("a cancelled step never moves", () => {
  vi.useFakeTimers();
  const go = vi.fn();
  scheduleNext(0, 6, go)();
  vi.advanceTimersByTime(stepMs * 2);
  expect(go).not.toHaveBeenCalled();
});
