/** @vitest-environment jsdom */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  familyNetwork,
  memberProfile,
  problem,
  renderApp,
  resetApp,
  selfProfile,
  switchProfile,
  switcherText,
} from "@/test/render-app";

vi.setConfig({ testTimeout: 15_000 });

const reportId = "00000000-0000-4000-8000-0000000000c1";
const path = `/reports/${reportId}/markers/tsh`;

const markerPage = {
  report: {
    id: reportId,
    title: "Thyroid panel",
    labName: "Made-up Labs B",
    collectedAt: "2026-08-04",
    createdAt: "2026-08-05T10:00:00.000Z",
  },
  profile: { id: memberProfile.id, sex: "male", ancestry: "south_asian" },
  marker: {
    markerKey: "tsh",
    name: "Thyroid stimulating hormone",
    shortName: "TSH",
    description: "",
    value: null,
    valueText: null,
    printed: null,
    equation: null,
    unit: "µIU/mL",
    precision: 2,
    status: "unknown",
    deviation: null,
    labRange: null,
    calibratedRange: null,
    labName: "Made-up Labs B",
  },
  watchRange: null,
  calibratedSource: null,
  history: [],
  knowledge: {
    whatItIs: "Made-up text.",
    whyItMatters: "Made-up text.",
    whatMovesIt: "Made-up text.",
  },
  southAsianNote: null,
  sources: [],
  followUps: [],
  previous: null,
  next: null,
};

const network = (marker: () => object | Response) => familyNetwork({ [`GET ${path}`]: marker });

afterEach(resetApp);

test("opening a family member's marker page makes that member the active profile", async () => {
  network(() => markerPage);
  await renderApp(path);

  expect(await screen.findByRole("heading", { name: markerPage.marker.name })).toBeTruthy();
  await waitFor(() => expect(switcherText()).toContain(memberProfile.name));
});

test("a marker page that returns 404 keeps the active profile", async () => {
  network(() => problem(404));
  await renderApp(path);

  await waitFor(() => expect(switcherText()).toContain(selfProfile.name));
  expect(switcherText()).not.toContain(memberProfile.name);
});

test("switching profile on a family member's marker page opens the new profile's reports", async () => {
  const requests = network(() => markerPage);
  await renderApp(path);
  await waitFor(() => expect(switcherText()).toContain(memberProfile.name));

  await switchProfile(/Asha Rao/);

  await waitFor(() => expect(window.location.pathname).toBe("/reports"));
  expect(switcherText()).toContain(selfProfile.name);
  await waitFor(() =>
    expect(screen.queryByRole("heading", { name: markerPage.marker.name })).toBeNull(),
  );
  await waitFor(() =>
    expect(requests.some(({ path }) => path === `/reports?profileId=${selfProfile.id}`)).toBe(true),
  );
});
