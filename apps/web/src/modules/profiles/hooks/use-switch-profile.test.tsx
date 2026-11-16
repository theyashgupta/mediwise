/** @vitest-environment jsdom */
import { waitFor } from "@testing-library/react";
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

afterEach(resetApp);

test("switching profile on the reports list stays on the list", async () => {
  const requests = familyNetwork();
  await renderApp("/reports");
  await waitFor(() => expect(switcherText()).toContain(selfProfile.name));

  await switchProfile(/Ravi Rao/);

  await waitFor(() =>
    expect(requests.some(({ path }) => path.includes(`profileId=${memberProfile.id}`))).toBe(true),
  );
  expect(window.location.pathname).toBe("/reports");
  expect(switcherText()).toContain(memberProfile.name);
});

test("switching profile on the settings page stays on settings", async () => {
  familyNetwork();
  await renderApp("/settings");
  await waitFor(() => expect(switcherText()).toContain(selfProfile.name));

  await switchProfile(/Ravi Rao/);

  await waitFor(() => expect(switcherText()).toContain(memberProfile.name));
  expect(window.location.pathname).toBe("/settings");
});
