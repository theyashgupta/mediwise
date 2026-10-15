/** @vitest-environment jsdom */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, me, renderApp, resetApp, selfProfile } from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

const reportId = "00000000-0000-4000-8000-0000000000c1";
const dashboard = {
  latest: {
    id: reportId,
    labName: "Made-up Labs B",
    title: "Blood panel",
    collectedAt: "2026-08-04",
    date: "2026-08-04",
    score: null,
    tier: null,
    coverage: null,
    mappedCount: 2,
    counts: { optimal: 0, watch: 2, risk: 0 },
    deltaSincePrevious: null,
  },
  newSince: [],
  moveFirst: [
    {
      reportId,
      markerKey: "ldl_cholesterol",
      name: "LDL cholesterol",
      description: null,
      value: 128,
      unit: "mg/dL",
      status: "watch",
    },
  ],
  attention: [
    {
      kind: "alert",
      group: "risk",
      markerKey: null,
      name: 'Your ultrasound report says: "Grade II fatty liver."',
      title: 'Your ultrasound report says: "Grade II fatty liver."',
      reportId,
      date: "2026-08-04",
    },
    {
      kind: "marker",
      group: "risk",
      markerKey: "vitamin_b12",
      name: "Vitamin B12",
      reportId: "00000000-0000-4000-8000-0000000000c0",
      date: "2026-03-12",
      value: 186,
      unit: "pg/mL",
      status: "risk",
      direction: "stable",
      precision: 0,
      previous: null,
    },
    {
      kind: "marker",
      group: "worsening",
      markerKey: "tsh",
      name: "Thyroid stimulating hormone",
      reportId,
      date: "2026-08-04",
      value: 5.8,
      unit: "µIU/mL",
      status: "watch",
      direction: "worsening",
      precision: 2,
      previous: {
        reportId: "00000000-0000-4000-8000-0000000000c0",
        date: "2026-03-12",
        value: 4.6,
      },
    },
  ],
  retests: [{ markerKey: "hba1c", name: "HbA1c", dueOn: "2027-08-03", measuredOn: "2025-08-04" }],
  newestFinding: { reportId, title: "HbA1c is in the watch range" },
  recent: [],
  processingCount: 0,
};
const meOn = {
  ...me,
  questionsLeft: 12,
  assistant: { enabled: true, outOfQuestions: null, reviewRequired: false, consented: false },
};

function network(assistantMe: object, home: object = dashboard) {
  return fakeNetwork({
    "GET /me": () => assistantMe,
    "GET /profiles": () => [selfProfile],
    "GET /dashboard": () => home,
    "GET /dashboard/family": () => [],
    [`GET /profiles/${selfProfile.id}/questions`]: () => [],
  });
}

afterEach(resetApp);

describe.each(["en", "hi"] as const)("the ask card on Home in %s", (locale) => {
  const t = messages[locale].dashboard.ask;

  test("the card shows a question for the move-first marker, the newest finding and the next retest", async () => {
    network(meOn);
    await renderApp("/", { locale });

    const card = await screen.findByRole("region", { name: t.title });
    expect(within(card).getByRole("link", { name: t.changed("LDL cholesterol") })).toBeTruthy();
    expect(
      within(card).getByRole("link", { name: t.finding("HbA1c is in the watch range") }),
    ).toBeTruthy();
    expect(within(card).getByRole("link", { name: t.retest("HbA1c") })).toBeTruthy();
  });

  test("while the assistant is off Home shows no ask card", async () => {
    network(me);
    await renderApp("/", { locale });

    expect(await screen.findByRole("heading", { name: "Blood panel" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });
});

test("a suggestion opens the ask page with the question in the input and sends nothing", async () => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const requests = network(meOn);
  await renderApp("/");
  const t = messages.en;

  await userEvent.click(
    await screen.findByRole(
      "link",
      { name: t.dashboard.ask.changed("LDL cholesterol") },
      { timeout: 10_000 },
    ),
  );

  const input = await screen.findByRole(
    "textbox",
    { name: t.assistant.inputLabel },
    { timeout: 10_000 },
  );
  await waitFor(() =>
    expect((input as HTMLTextAreaElement).value).toBe(t.dashboard.ask.changed("LDL cholesterol")),
  );
  expect(window.location.search).toContain(`report=${reportId}`);
  expect(requests.some(({ method }) => method === "POST")).toBe(false);
});

describe.each(["en", "hi"] as const)("the attention list on Home in %s", (locale) => {
  const t = messages[locale].dashboard.attention;

  test("rows from every report show with their date and change, and the chips filter them", async () => {
    const recent = {
      id: reportId,
      status: "done",
      error: null,
      labName: "Made-up Labs B",
      title: "Blood panel",
      collectedAt: "2026-08-04",
      date: "2026-08-04",
      score: null,
      tier: null,
      fileNames: [],
    };
    network(me, { ...dashboard, recent: [recent] });
    await renderApp("/", { locale });

    const list = await screen.findByRole("region", { name: t.title });
    const rows = () =>
      within(list)
        .getAllByTestId("attention-row")
        .map((row) => row.textContent);
    expect(rows()).toHaveLength(3);
    expect(rows()[1]).toContain("Vitamin B12");
    expect(rows()[2]).toContain(t.worsening);
    expect(rows()[2]).toContain("+1.2");

    await userEvent.click(within(list).getByRole("button", { name: t.filters.worsening }));
    expect(rows()).toEqual([expect.stringContaining("Thyroid stimulating hormone")]);

    await userEvent.click(within(list).getByRole("button", { name: t.filters.risk }));
    expect(rows()).toHaveLength(2);

    await userEvent.click(within(list).getByRole("button", { name: t.filters.watch }));
    expect(rows()).toEqual([expect.stringContaining("Thyroid stimulating hormone")]);
  });
});
