/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
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
  suggestions: [],
  patterns: [],
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
    expect(within(card).getByRole("button", { name: t.changed("LDL cholesterol") })).toBeTruthy();
    expect(
      within(card).getByRole("button", { name: t.finding("HbA1c is in the watch range") }),
    ).toBeTruthy();
    expect(within(card).getByRole("button", { name: t.retest("HbA1c") })).toBeTruthy();
  });

  test("while the assistant is off Home shows no ask card", async () => {
    network(me);
    await renderApp("/", { locale });

    expect(await screen.findByRole("heading", { name: "Blood panel" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: t.title })).toBeNull();
  });
});

test("a suggestion opens the chat widget on Home with the question in the input and sends nothing", async () => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  const requests = network(meOn);
  await renderApp("/");
  const t = messages.en;

  await userEvent.click(
    await screen.findByRole(
      "button",
      { name: t.dashboard.ask.changed("LDL cholesterol") },
      { timeout: 10_000 },
    ),
  );

  const panel = await screen.findByRole("dialog");
  const input = await within(panel).findByRole(
    "textbox",
    { name: t.assistant.inputLabel },
    { timeout: 10_000 },
  );
  expect((input as HTMLTextAreaElement).value).toBe(t.dashboard.ask.changed("LDL cholesterol"));
  expect(window.location.pathname).toBe("/");
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

const olderReportId = "00000000-0000-4000-8000-0000000000c0";
const disclaimer = "MediWise is for information. Ask your doctor before you act on this.";
const b12Marker = {
  markerKey: "vitamin_b12",
  name: "Vitamin B12",
  value: 186,
  unit: "pg/mL",
  reportId: olderReportId,
};

function suggestion(kind: string, rank: number, title: string, markers: object[] = []) {
  return {
    kind,
    markerKeys: markers.map(() => "vitamin_b12"),
    markers,
    reportId,
    date: "2026-08-04",
    sources: [],
    title,
    why: `Why ${title}`,
    next: `Next ${title}`,
    disclaimer,
    rank,
    ...(kind === "retest" && { dueOn: "2026-11-01" }),
  };
}

const overview = {
  ...dashboard,
  recent: [
    {
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
    },
  ],
  suggestions: [
    suggestion("doctor_now", 1, "Your ultrasound report needs a doctor."),
    suggestion("doctor_soon", 2, "Show your Vitamin B12 result to your doctor", [b12Marker]),
    suggestion("supplement_ask", 3, "Ask your doctor about a supplement for low Vitamin B12", [
      b12Marker,
    ]),
    suggestion("retest", 4, "Retest your Vitamin B12", [b12Marker]),
    suggestion("habit", 5, "Habits that can help your Vitamin B12", [b12Marker]),
  ],
  patterns: [
    {
      key: "b12_deficiency",
      severity: "risk",
      change: "worsening",
      name: "B12 deficiency pattern",
      description: "High homocysteine with low or low-normal vitamin B12.",
      matched: [{ ...b12Marker, unit: "pg/mL" }],
    },
    {
      key: "prediabetes",
      severity: "watch",
      change: "cleared",
      name: "Prediabetes pattern",
      description: "HbA1c or fasting glucose in the prediabetes range.",
      matched: [{ markerKey: "hba1c", name: "HbA1c", value: 6.1, unit: "%", reportId }],
    },
  ],
};

const yearReview = {
  from: "2025-11-02",
  to: "2026-09-20",
  reportCount: 3,
  labCount: 2,
  score: { from: 71, to: 78 },
  intro: [],
  moved: [],
  stillAtRisk: [],
  measuredOnce: [],
};

function overviewNetwork(home: object) {
  return fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /dashboard": () => home,
    "GET /dashboard/family": () => [],
    [`GET /profiles/${selfProfile.id}/year-review`]: () => yearReview,
    [`GET /profiles/${selfProfile.id}/questions`]: () => [],
  });
}

describe.each(["en", "hi"] as const)("the health overview on Home in %s", (locale) => {
  const t = messages[locale];
  const blocks = [t.dashboard.doctor, t.dashboard.patterns, t.dashboard.retest, t.dashboard.habits];

  test("the blocks come in the ticket order, above the report card, the year in review and the family list", async () => {
    overviewNetwork(overview);
    await renderApp("/", { locale });
    await screen.findByRole("heading", { name: t.yearReview.title });

    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    const order = [
      t.dashboard.attention.title,
      ...blocks.map(({ title }) => title),
      "Blood panel",
      t.yearReview.title,
      t.dashboard.family.title,
      t.dashboard.recent.title,
    ].map((title) => headings.indexOf(title));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual(order.toSorted((a, b) => a - b));
  });

  test("a Home load with no year in review intro only reads, so it never asks for an intro", async () => {
    const requests = fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [selfProfile],
      "GET /dashboard": () => overview,
      "GET /dashboard/family": () => [],
      [`GET /profiles/${selfProfile.id}/year-review`]: () => ({ ...yearReview, intro: null }),
      [`GET /profiles/${selfProfile.id}/questions`]: () => [],
    });
    await renderApp("/", { locale });

    expect(await screen.findByRole("heading", { name: t.yearReview.title })).toBeTruthy();
    expect(requests.filter((r) => r.method !== "GET")).toEqual([]);
  });

  test("each block has one source line, a link to trends and, with a suggestion, one disclaimer", async () => {
    overviewNetwork(overview);
    await renderApp("/", { locale });

    for (const block of [t.dashboard.attention, ...blocks]) {
      const region = await screen.findByRole("region", { name: block.title });
      expect(within(region).getByText(block.source)).toBeTruthy();
      expect(
        within(region).getByRole("link", { name: t.dashboard.trendsLink }).getAttribute("href"),
      ).toBe("/trends");
    }
    for (const block of blocks) {
      const region = screen.getByRole("region", { name: block.title });
      expect(within(region).getAllByTestId("suggestion-disclaimer")).toHaveLength(1);
    }
  });

  test("see a doctor shows today in red with its study link and soon in amber with its markers", async () => {
    overviewNetwork(overview);
    await renderApp("/", { locale });

    const region = await screen.findByRole("region", { name: t.dashboard.doctor.title });
    const now = within(region).getByTestId("suggestion-doctor_now");
    expect(within(now).getByText(t.dashboard.doctor.now).className).toContain("text-risk");
    expect(
      within(now)
        .getByRole("link", { name: t.dashboard.suggestion.openStudy })
        .getAttribute("href"),
    ).toBe(`/reports/${reportId}#studies`);
    const soon = within(region).getByTestId("suggestion-doctor_soon");
    expect(within(soon).getByText(t.dashboard.doctor.soon).className).toContain("text-watch");
    expect(
      within(soon)
        .getByRole("link", { name: /Vitamin B12/ })
        .getAttribute("href"),
    ).toBe(`/reports/${olderReportId}/markers/vitamin_b12`);
  });

  test("patterns show their change, and a cleared pattern shows no marker", async () => {
    overviewNetwork(overview);
    await renderApp("/", { locale });

    const rows = within(
      await screen.findByRole("region", { name: t.dashboard.patterns.title }),
    ).getAllByTestId("pattern-row");
    expect(rows[0]?.textContent).toContain(t.dashboard.patterns.change.worsening);
    expect(within(rows[0]!).getByRole("link", { name: /Vitamin B12/ })).toBeTruthy();
    expect(rows[1]?.textContent).toContain(t.dashboard.patterns.change.cleared);
    expect(within(rows[1]!).queryByRole("link")).toBeNull();
  });

  test("habits and questions group the habit and the supplement suggestions, and retests add the proposed one", async () => {
    overviewNetwork(overview);
    await renderApp("/", { locale });

    const habits = await screen.findByRole("region", { name: t.dashboard.habits.title });
    const habitList = within(habits).getByRole("list", { name: t.dashboard.habits.habits });
    const questionList = within(habits).getByRole("list", { name: t.dashboard.habits.questions });
    expect(within(habitList).getByTestId("suggestion-habit")).toBeTruthy();
    expect(within(questionList).getByTestId("suggestion-supplement_ask")).toBeTruthy();
    const retests = screen.getByRole("region", { name: t.dashboard.retest.title });
    expect(within(retests).getByTestId("retest-row-vitamin_b12").textContent).toContain(
      "Why Retest your Vitamin B12",
    );
  });

  test("with no suggestion and no pattern Home shows no doctor, patterns or habits block and keeps the rest", async () => {
    overviewNetwork({ ...overview, suggestions: [], patterns: [] });
    await renderApp("/", { locale });

    expect(await screen.findByRole("heading", { name: t.yearReview.title })).toBeTruthy();
    for (const block of [t.dashboard.doctor, t.dashboard.patterns, t.dashboard.habits]) {
      expect(screen.queryByRole("region", { name: block.title })).toBeNull();
    }
    expect(screen.getByRole("region", { name: t.dashboard.attention.title })).toBeTruthy();
    expect(screen.getByRole("heading", { name: t.dashboard.family.title })).toBeTruthy();
    expect(screen.queryAllByTestId("suggestion-disclaimer")).toHaveLength(0);
  });
});
