import type { AssistantCite } from "@mediwise/shared";
import { beforeEach, expect, test, vi } from "vitest";

const ids = vi.hoisted(() => ({
  report: "e1000000-0000-4000-8000-000000000001",
  otherReport: "e1000000-0000-4000-8000-000000000002",
  study: "51000000-0000-4000-8000-000000000001",
  finding: "f1000000-0000-4000-8000-000000000001",
  followUp: "f2000000-0000-4000-8000-000000000001",
  episode: "ep000000-0000-4000-8000-000000000001",
}));

const store = vi.hoisted(() => {
  const owned = {
    reports: [
      {
        id: ids.report,
        title: "Blood panel",
        labName: "Sunrise Diagnostics",
        date: "2026-08-04",
        patterns: [{ key: "b12_deficiency" }],
      },
    ],
    studies: [
      {
        id: ids.study,
        reportId: ids.report,
        kind: "ultrasound",
        bodyRegion: "Abdomen",
        performedAt: "2026-08-06",
        labName: "Lakeview Imaging Centre",
      },
    ],
    findings: [{ id: ids.finding, reportId: ids.report, title: "HbA1c is in the watch range" }],
    followUps: [{ id: ids.followUp, reportId: ids.report, title: "Retest HbA1c" }],
    episodes: [{ id: ids.episode, name: "Thyroid workup", startedOn: "2026-08-01" }],
  };
  const empty = { reports: [], studies: [], findings: [], followUps: [], episodes: [] };
  return {
    day: [] as Record<string, unknown>[],
    facts: [] as Record<string, unknown>[],
    reviews: [] as { questionId: string; verdict: string }[],
    repo: {
      findCiteRows: vi.fn(async (userId: string) => (userId === "alice" ? owned : empty)),
      listReviewDay: async () => store.day,
      findMarkerFacts: vi.fn(async () => store.facts),
      upsertReview: async (questionId: string, verdict: string) => {
        store.reviews.push({ questionId, verdict });
      },
      countReviews: async () => [{ verdict: "pass", total: store.reviews.length }],
    },
  };
});

vi.mock("./assistant.repo.js", () => store.repo);

const { countReviews, loadReviewDay, storeReview } = await import("./assistant.service.js");

function question(id: string, userId: string, cites: AssistantCite[], extra = {}) {
  return {
    id,
    userId,
    question: "Which report?",
    answer: { sentences: [{ text: "Cited.", cites }] },
    refusalKind: null,
    flaggedAt: null,
    createdAt: new Date("2026-10-13T10:00:00Z"),
    verdict: null,
    ...extra,
  };
}

beforeEach(() => {
  store.day = [];
  store.facts = [];
  store.reviews = [];
  store.repo.findCiteRows.mockClear();
  store.repo.findMarkerFacts.mockClear();
});

test("every cite kind gets the label, lab and date its chip shows", async () => {
  store.day = [
    question("q1", "alice", [
      { kind: "value", reportId: ids.report, target: "hba1c" },
      { kind: "catalog", reportId: null, target: "not_a_marker" },
      { kind: "study", reportId: ids.report, target: ids.study },
      { kind: "study", reportId: ids.report, target: "missing" },
      { kind: "finding", reportId: ids.report, target: ids.finding },
      { kind: "finding", reportId: ids.report, target: "missing" },
      { kind: "follow_up", reportId: ids.report, target: ids.followUp },
      { kind: "pattern", reportId: ids.report, target: "b12_deficiency" },
      { kind: "pattern", reportId: ids.report, target: "unknown_pattern" },
      { kind: "episode", reportId: null, target: ids.episode },
      { kind: "episode", reportId: null, target: "missing" },
      { kind: "link", reportId: ids.report, target: ids.otherReport },
      { kind: "report", reportId: ids.report, target: null },
    ]),
  ];

  const [item] = await loadReviewDay("2026-10-13", () => true);

  const shown = { labName: "Sunrise Diagnostics", date: "2026-08-04", deleted: false };
  expect(item!.sentences[0]!.cites).toMatchObject([
    { label: "HbA1c", ...shown },
    { label: "not_a_marker", labName: null, date: null, deleted: false },
    { label: "ultrasound, Abdomen", labName: "Lakeview Imaging Centre", date: "2026-08-06" },
    { label: "Blood panel", ...shown },
    { label: "HbA1c is in the watch range", ...shown },
    { label: "Blood panel", ...shown },
    { label: "Retest HbA1c", ...shown },
    { label: "B12 deficiency pattern", ...shown },
    { label: "Blood panel", ...shown },
    { label: "Thyroid workup", date: "2026-08-01", deleted: false },
    { label: null, labName: null, date: null, deleted: true },
    { label: null, ...shown },
    { label: "Blood panel", ...shown },
  ]);
  expect(store.repo.findCiteRows).toHaveBeenCalledWith("alice", {
    reports: [ids.report],
    studies: [ids.study, "missing"],
    findings: [ids.finding, "missing"],
    followUps: [ids.followUp],
    episodes: [ids.episode, "missing"],
  });
});

test("the review day keeps only sampled questions and resolves each as its own owner", async () => {
  store.day = [
    question("kept", "alice", [{ kind: "value", reportId: ids.report, target: "hba1c" }], {
      verdict: "minor",
    }),
    question("stranger", "bob", [{ kind: "value", reportId: ids.report, target: "hba1c" }]),
    question("left-out", "alice", [], { refusalKind: "fallback", flaggedAt: new Date() }),
  ];
  const sampled = vi.fn(({ id }: { id: string }) => id !== "left-out");

  const day = await loadReviewDay("2026-10-13", sampled);

  expect(sampled).toHaveBeenCalledWith({ id: "left-out", refusalKind: "fallback", flagged: true });
  expect(day.map(({ id, verdict }) => ({ id, verdict }))).toEqual([
    { id: "kept", verdict: "minor" },
    { id: "stranger", verdict: null },
  ]);
  expect(day[1]!.sentences[0]!.cites[0]).toMatchObject({ label: null, deleted: true });
  expect(JSON.stringify(day)).not.toContain("alice");
  expect(store.repo.findMarkerFacts).toHaveBeenCalledWith("alice", [
    { reportId: ids.report, markerKey: "hba1c" },
  ]);
  expect(store.repo.findMarkerFacts).toHaveBeenCalledWith("bob", []);
});

test("the review day shows only the stored values that a value cite of the item names", async () => {
  store.day = [question("q1", "alice", [{ kind: "value", reportId: ids.report, target: "hba1c" }])];
  store.facts = [
    { reportId: ids.report, markerKey: "hba1c", value: 5.9 },
    { reportId: ids.report, markerKey: "ldl", value: 140 },
    { reportId: ids.otherReport, markerKey: "hba1c", value: 6.4 },
  ];

  const [item] = await loadReviewDay("2026-10-13", () => true);

  expect(item!.facts).toEqual([{ reportId: ids.report, markerKey: "hba1c", value: 5.9 }]);
});

test("a stored verdict is counted in the review tally", async () => {
  await storeReview("q1", "pass");

  expect(store.reviews).toEqual([{ questionId: "q1", verdict: "pass" }]);
  expect(await countReviews()).toEqual([{ verdict: "pass", total: 1 }]);
});

test("a pattern chip keeps its target only when its report holds that pattern, so it never links to a missing fold", async () => {
  store.day = [
    question("q1", "alice", [
      { kind: "pattern", reportId: ids.report, target: "b12_deficiency" },
      { kind: "pattern", reportId: ids.report, target: "prediabetes" },
    ]),
  ];

  const [item] = await loadReviewDay("2026-10-13", () => true);

  expect(item!.sentences[0]!.cites).toMatchObject([
    { target: "b12_deficiency", label: "B12 deficiency pattern" },
    { target: null, label: "Prediabetes range" },
  ]);
});
