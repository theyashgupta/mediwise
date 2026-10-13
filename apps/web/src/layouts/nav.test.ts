import { expect, test } from "vitest";
import { fillPath, navItems, pageTrail, resolveShortcut } from "./nav";

test("g then a destination key goes to that destination", () => {
  expect(resolveShortcut("g", false)).toEqual({ action: "wait-for-destination" });
  expect(navItems.map((item) => resolveShortcut(item.key, true))).toEqual([
    { action: "go", to: "/" },
    { action: "go", to: "/reports" },
    { action: "go", to: "/trends" },
    { action: "go", to: "/profiles" },
    { action: "go", to: "/settings" },
  ]);
});

test("a destination key without g first does nothing", () => {
  expect(resolveShortcut("h", false)).toBeUndefined();
  expect(resolveShortcut("x", true)).toBeUndefined();
});

test("[ toggles the sidebar and ? shows the shortcuts", () => {
  expect(resolveShortcut("[", false)).toEqual({ action: "toggle-sidebar" });
  expect(resolveShortcut("?", false)).toEqual({ action: "show-shortcuts" });
});

test("a marker page trail runs from Reports through its report", () => {
  expect(
    pageTrail("/_app/reports/$reportId_/markers/$markerKey").map((step) => step.page.title),
  ).toEqual(["Reports", "Report", "Marker"]);
  expect(pageTrail("/_auth/login")).toEqual([]);
});

test("fillPath puts the current params into a route path", () => {
  expect(
    fillPath("/reports/$reportId/markers/$markerKey", { reportId: "r1", markerKey: "ldl" }),
  ).toBe("/reports/r1/markers/ldl");
});
