/** @vitest-environment jsdom */
import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import {
  familyNetwork,
  memberProfile,
  renderApp,
  resetApp,
  selfProfile,
  switchProfile,
  switcherText,
} from "@/test/render-app";

vi.setConfig({ testTimeout: 15_000 });

const episode = {
  id: "00000000-0000-4000-8000-0000000000e1",
  profileId: memberProfile.id,
  name: "Thyroid tests",
  startedOn: "2025-02-03",
  endedOn: null,
  note: null,
  from: "2025-02-03",
  to: "2025-02-03",
  timeline: [],
  repeated: [],
  studies: [],
  outstanding: { markers: [], studies: [] },
  summary: [],
};
const path = `/episodes/${episode.id}`;

function network(self = selfProfile) {
  return familyNetwork({
    "GET /profiles": () => [self, memberProfile],
    "GET /dashboard": () => ({
      recent: [],
      latest: null,
      newSince: [],
      attention: [],
      suggestions: [],
      patterns: [],
      retests: [],
      processingCount: 0,
    }),
    "GET /dashboard/family": () => [],
    [`GET ${path}`]: () => episode,
  });
}

afterEach(resetApp);

test("opening a family member's episode makes that member the active profile", async () => {
  network();
  await renderApp(path);

  expect(await screen.findByRole("heading", { name: episode.name })).toBeTruthy();
  await waitFor(() => expect(switcherText()).toContain(memberProfile.name));
});

test("switching to a profile with no reports on an episode page opens home", async () => {
  network({ ...selfProfile, reportCount: 0 });
  await renderApp(path);
  await waitFor(() => expect(switcherText()).toContain(memberProfile.name));

  await switchProfile(/Asha Rao/);

  await waitFor(() => expect(window.location.pathname).toBe("/"));
  expect(switcherText()).toContain(selfProfile.name);
  await waitFor(() => expect(screen.queryByRole("heading", { name: episode.name })).toBeNull());
});
