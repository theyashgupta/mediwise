/** @vitest-environment jsdom */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import {
  familyNetwork,
  memberProfile,
  problem,
  renderApp,
  resetApp,
  selfProfile,
  switchProfile,
} from "@/test/render-app";

vi.setConfig({ testTimeout: 15_000 });

const trend = {
  markerKey: "tsh",
  name: "Thyroid stimulating hormone",
  category: "thyroid",
  unit: "µIU/mL",
  precision: 2,
  calibratedRange: null,
  labCount: 1,
  change: null,
  direction: "stable",
  suggestion: null,
  points: [],
};
const text = messages.en.trends.detail;
const missing = () => problem(404);

/** Serves the TSH trend per profile id, so each profile can have or lack the marker. */
function network(self: () => object | Response, member: () => object | Response) {
  return familyNetwork({
    "GET /trends": () => ({ markers: [], watch: [] }),
    "GET /trends/tsh": ({ path }) => (path.includes(memberProfile.id) ? member() : self()),
  });
}

afterEach(resetApp);

test("switching to a profile that has the marker keeps the trend page", async () => {
  network(
    () => trend,
    () => trend,
  );
  await renderApp("/trends/tsh");
  expect(await screen.findByText(text.values(0, selfProfile.name))).toBeTruthy();

  await switchProfile(/Ravi Rao/);

  expect(await screen.findByText(text.values(0, memberProfile.name))).toBeTruthy();
  expect(window.location.pathname).toBe("/trends/tsh");
});

test("switching to a profile without the marker opens the trends list", async () => {
  network(() => trend, missing);
  await renderApp("/trends/tsh");
  expect(await screen.findByRole("heading", { name: trend.name })).toBeTruthy();

  await switchProfile(/Ravi Rao/);

  await waitFor(() => expect(window.location.pathname).toBe("/trends"));
  expect(screen.queryByText(text.emptyTitle)).toBeNull();
});

test("a direct visit to a trend with no values shows the empty state and stays", async () => {
  network(missing, () => trend);
  await renderApp("/trends/tsh");

  expect(await screen.findByText(text.emptyTitle)).toBeTruthy();
  expect(window.location.pathname).toBe("/trends/tsh");
});

test("after a direct visit with no values, switching away and back to the empty profile opens the trends list", async () => {
  network(missing, () => trend);
  await renderApp("/trends/tsh");
  expect(await screen.findByText(text.emptyTitle)).toBeTruthy();

  await switchProfile(/Ravi Rao/);
  expect(await screen.findByText(text.values(0, memberProfile.name))).toBeTruthy();
  await switchProfile(/Asha Rao/);

  await waitFor(() => expect(window.location.pathname).toBe("/trends"));
});
