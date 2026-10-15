import { Hono } from "hono";
import { testClient } from "hono/testing";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { dashboardRoutes } from "./dashboard.routes.js";

const profileId = vi.hoisted(() => "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10");
const store = vi.hoisted(() => {
  type Report = {
    id: string;
    status: string;
    error: string | null;
    labName: string | null;
    collectedAt: string | null;
    date: string;
    score: number | null;
    tier: string | null;
    coverage: number | null;
    mappedCount: number;
  };
  type Marker = {
    markerKey: string | null;
    rawName: string;
    value: number | null;
    unit: string | null;
    status: "optimal" | "watch" | "risk";
    calibratedLow: number | null;
    calibratedHigh: number | null;
  };
  type FamilyRow = {
    profileId: string;
    name: string;
    relation: "self" | "parent" | "child";
    reportId: string | null;
    date: string | null;
    uploadedAt: Date | null;
    score: number | null;
    tier: string | null;
  };
  const reports: Report[] = [];
  const markers = new Map<string, Marker[]>();
  const alerts = new Map<string, string[]>();
  const family: FamilyRow[] = [];
  const owned = (owner: string, id: string) => owner === "alice" && id === profileId;
  const newestFirst = () => [...reports].sort((a, b) => b.date.localeCompare(a.date));
  return {
    reports,
    markers,
    alerts,
    family,
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owned(owner, id) ? { id, isSelf: true } : undefined,
    },
    repo: {
      listRecentReports: async (owner: string, id: string, limit: number) =>
        owned(owner, id) ? newestFirst().slice(0, limit) : [],
      listLatestDoneReports: async (owner: string, id: string, limit: number) =>
        owned(owner, id)
          ? newestFirst()
              .filter((report) => report.status === "done")
              .slice(0, limit)
          : [],
      countReportsInProgress: async (owner: string, id: string) =>
        owned(owner, id)
          ? reports.filter((report) => ["queued", "processing"].includes(report.status)).length
          : 0,
      listAssessedMarkers: async (reportId: string) => markers.get(reportId) ?? [],
      listMarkerHistory: async (owner: string, id: string) =>
        owned(owner, id)
          ? newestFirst()
              .toReversed()
              .filter((report) => report.status === "done")
              .flatMap((report) =>
                (markers.get(report.id) ?? []).flatMap(({ markerKey, ...row }) =>
                  markerKey ? [{ reportId: report.id, date: report.date, markerKey, ...row }] : [],
                ),
              )
          : [],
      listAlertFindings: async (owner: string, id: string) =>
        owned(owner, id)
          ? newestFirst()
              .toReversed()
              .flatMap((report) =>
                (alerts.get(report.id) ?? []).map((title, index) => ({
                  reportId: report.id,
                  date: report.date,
                  kind: "study_alert" as const,
                  title,
                  citedKeys: [],
                  citedStudyIds: [`${report.id}-study-${index}`],
                })),
              )
          : [],
      listLatestAssessedByMarker: async (owner: string, id: string) => {
        if (!owned(owner, id)) return [];
        const worst = { risk: 0, watch: 1, optimal: 2 };
        const rows = newestFirst()
          .filter((report) => report.status === "done" && report.collectedAt)
          .flatMap((report) =>
            (markers.get(report.id) ?? [])
              .toSorted((a, b) => worst[a.status] - worst[b.status])
              .map((row) => ({ ...row, collectedAt: report.collectedAt })),
          );
        return rows.filter(
          (row, i) => rows.findIndex((other) => other.markerKey === row.markerKey) === i,
        );
      },
      listFamilyDoneReports: async (owner: string) => (owner === "alice" ? family : []),
      countRiskMarkers: async (reportIds: string[]) =>
        reportIds.flatMap((reportId) => {
          const total = (markers.get(reportId) ?? []).filter((m) => m.status === "risk").length;
          return total > 0 ? [{ reportId, total }] : [];
        }),
    },
  };
});

const findings = vi.hoisted(() => new Map<string, { title: string }[]>());
const claude = vi.hoisted(() => ({
  create: vi.fn(() => {
    throw new Error("Home must not call Claude");
  }),
}));

vi.mock("./dashboard.repo.js", () => store.repo);
vi.mock("../findings/findings.repo.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../findings/findings.repo.js")>()),
  listFindings: async (reportId: string) => findings.get(reportId) ?? [],
  findVisit: async () => undefined,
}));
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: claude.create } } }));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/dashboard", dashboardRoutes);
app.onError(handleError);

function done(id: string, date: string, score: number) {
  return {
    id,
    status: "done",
    error: null,
    labName: "Lab",
    collectedAt: date,
    date,
    score,
    tier: "gold",
    coverage: 90,
    mappedCount: 40,
  };
}

function glucoseOnly(id: string, date: string) {
  return { ...done(id, date, 50), coverage: 6, mappedCount: 1 };
}

function marker(markerKey: string, value: number, status: "optimal" | "watch" | "risk") {
  return {
    markerKey,
    rawName: markerKey,
    value,
    unit: "x",
    status,
    calibratedLow: 10,
    calibratedHigh: 20,
  };
}

const client = testClient(app);

async function dashboard(user = "alice", locale = "en") {
  return client.dashboard.$get(
    { query: { profileId } },
    { headers: { "x-user": user, "accept-language": locale } },
  );
}

async function body(locale = "en") {
  const res = await dashboard("alice", locale);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

beforeEach(() => {
  findings.clear();
  store.reports.length = 0;
  store.family.length = 0;
  store.markers.clear();
  store.alerts.clear();
});

test("a profile with no reports gets an empty dashboard", async () => {
  const res = await dashboard();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    latest: null,
    newSince: [],
    moveFirst: [],
    attention: [],
    suggestions: [],
    patterns: [],
    retests: [],
    newestFinding: null,
    recent: [],
    processingCount: 0,
  });
});

test("the newest finding is the top open finding of the newest report that has one", async () => {
  store.reports.push(
    done("full", "2026-09-15", 80),
    glucoseOnly("week-1", "2026-09-22"),
    glucoseOnly("week-2", "2026-09-29"),
  );
  findings.set("full", [{ title: "HbA1c is in the risk range" }, { title: "LDL is high" }]);
  expect((await body()).newestFinding).toEqual({
    reportId: "full",
    title: "HbA1c is in the risk range",
  });

  findings.set("week-2", [{ title: "Fasting glucose is up" }]);
  expect((await body()).newestFinding).toEqual({
    reportId: "week-2",
    title: "Fasting glucose is up",
  });
});

test("reports with no finding give no newest finding", async () => {
  store.reports.push(done("full", "2026-09-15", 80));
  expect((await body()).newestFinding).toBeNull();
});

test("the latest done report carries its counts and the score change since the previous one", async () => {
  store.reports.push(done("old", "2026-03-12", 70), done("new", "2026-09-01", 74));
  store.markers.set("new", [
    marker("glucose", 15, "optimal"),
    marker("ldl", 22, "watch"),
    marker("hba1c", 40, "risk"),
  ]);
  const data = await body();
  expect(data.latest).toMatchObject({
    id: "new",
    date: "2026-09-01",
    score: 74,
    counts: { optimal: 1, watch: 1, risk: 1 },
    deltaSincePrevious: { score: 4, since: "2026-03-12" },
  });
  expect(data.recent.map((report) => report.id)).toEqual(["new", "old"]);
});

test("the score change skips a narrow report and compares with the previous full panel", async () => {
  store.reports.push(
    done("full", "2026-08-04", 70),
    glucoseOnly("glucose-only", "2026-09-29"),
    done("new", "2026-10-06", 74),
  );
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toEqual({ score: 4, since: "2026-08-04" });
});

test("a narrow report on the same score scale is not compared with a full panel", async () => {
  store.reports.push(
    done("full", "2026-08-04", 70),
    { ...done("narrow", "2026-09-29", 90), mappedCount: 9 },
    done("new", "2026-10-06", 74),
  );
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toEqual({ score: 4, since: "2026-08-04" });
});

test("narrow reports with no full panel compare with each other", async () => {
  store.reports.push(glucoseOnly("week-1", "2026-09-22"), {
    ...glucoseOnly("week-2", "2026-09-29"),
    score: 53,
  });
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toEqual({ score: 3, since: "2026-09-22" });
});

test("a narrow report after a full panel leaves the full panel on top and lists itself as new since", async () => {
  store.reports.push(
    done("older", "2026-08-04", 76),
    done("full", "2026-09-15", 80),
    glucoseOnly("week-1", "2026-09-22"),
    glucoseOnly("week-2", "2026-09-29"),
  );
  store.markers.set("full", [marker("hba1c", 40, "risk"), marker("ldl", 15, "optimal")]);
  store.markers.set("week-1", [marker("glucose_fasting", 15, "optimal")]);
  store.markers.set("week-2", [marker("glucose_fasting", 30, "watch")]);
  const data = await body();
  expect(data.latest).toMatchObject({
    id: "full",
    score: 80,
    counts: { optimal: 1, watch: 0, risk: 1 },
    deltaSincePrevious: { score: 4, since: "2026-08-04" },
  });
  expect(data.moveFirst.map((row) => [row.reportId, row.markerKey])).toEqual([["full", "hba1c"]]);
  expect(data.newSince).toEqual([
    {
      id: "week-2",
      date: "2026-09-29",
      labName: "Lab",
      markers: [
        {
          markerKey: "glucose_fasting",
          name: expect.any(String),
          value: 30,
          unit: "x",
          status: "watch",
        },
      ],
    },
    expect.objectContaining({ id: "week-1", date: "2026-09-22" }),
  ]);
});

test("new since lists the three newest narrow reports", async () => {
  store.reports.push(
    done("full", "2026-09-01", 80),
    ...["2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29"].map((date) =>
      glucoseOnly(date, date),
    ),
  );
  const data = await body();
  expect(data.newSince.map((report) => report.id)).toEqual([
    "2026-09-29",
    "2026-09-22",
    "2026-09-15",
  ]);
});

test("with no report of ten mapped markers the newest report leads", async () => {
  store.reports.push(glucoseOnly("week-1", "2026-09-22"), glucoseOnly("week-2", "2026-09-29"));
  const data = await body();
  expect(data.latest?.id).toBe("week-2");
  expect(data.newSince).toEqual([]);
});

test("a full panel after narrow reports leads with nothing new since", async () => {
  store.reports.push(glucoseOnly("week-1", "2026-09-22"), done("full", "2026-09-29", 80));
  const data = await body();
  expect(data.latest?.id).toBe("full");
  expect(data.newSince).toEqual([]);
});

test("a report one week after the last one gives a score change", async () => {
  store.reports.push(done("week-1", "2026-09-29", 71), done("week-2", "2026-10-06", 73));
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toEqual({ score: 2, since: "2026-09-29" });
});

test("a second report from the same collection date is not the previous visit", async () => {
  store.reports.push(
    done("old", "2026-03-12", 70),
    done("new", "2026-09-01", 74),
    done("same-day", "2026-09-01", 72),
  );
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toEqual({ score: 4, since: "2026-03-12" });
});

test("one done report has no score change", async () => {
  store.reports.push(done("only", "2026-09-01", 74));
  const data = await body();
  expect(data.latest?.deltaSincePrevious).toBeNull();
});

test("move first lists risk before watch, furthest from optimal first, three at most", async () => {
  store.reports.push(done("r", "2026-09-01", 60));
  store.markers.set("r", [
    marker("ldl", 30, "watch"),
    marker("tsh", 21, "risk"),
    marker("hba1c", 40, "risk"),
    marker("ferritin", 2, "watch"),
    marker("glucose", 15, "optimal"),
  ]);
  const data = await body();
  expect(data.moveFirst.map((row) => row.markerKey)).toEqual(["hba1c", "tsh", "ldl"]);
  expect(data.moveFirst[0]).toMatchObject({
    reportId: "r",
    name: "HbA1c",
    value: 40,
    status: "risk",
  });
  expect(data.moveFirst[0]?.description).toEqual(expect.any(String));
});

function banded(
  markerKey: string,
  value: number,
  status: "optimal" | "watch" | "risk",
  [calibratedLow, calibratedHigh]: [number | null, number | null],
) {
  return { ...marker(markerKey, value, status), calibratedLow, calibratedHigh };
}

test("attention lists a worsening marker of the latest report and a risk marker measured only on an older one", async () => {
  store.reports.push(done("older", "2026-08-04", 70), done("latest", "2026-09-15", 74));
  store.markers.set("older", [
    banded("vitamin_b12", 450, "optimal", [300, null]),
    banded("tsh", 4.6, "watch", [0.45, 4.12]),
    marker("vitamin_d", 4, "risk"),
  ]);
  store.markers.set("latest", [
    banded("vitamin_b12", 280, "watch", [300, null]),
    banded("tsh", 5.8, "watch", [0.45, 4.12]),
    marker("hba1c", 40, "risk"),
    marker("ldl", 35, "risk"),
    marker("glucose_fasting", 30, "risk"),
    marker("ferritin", 22, "watch"),
  ]);
  store.alerts.set("older", ['Your ultrasound report says: "Grade II fatty liver."']);

  const data = await body();

  expect(data.attention.map((row) => [row.group, row.markerKey ?? row.title])).toEqual([
    ["risk", 'Your ultrasound report says: "Grade II fatty liver."'],
    ["risk", "hba1c"],
    ["risk", "ldl"],
    ["risk", "glucose_fasting"],
    ["risk", "vitamin_d"],
    ["worsening", "tsh"],
    ["worsening", "vitamin_b12"],
    ["watch", "ferritin"],
  ]);
  expect(data.attention.find((row) => row.markerKey === "vitamin_d")).toMatchObject({
    reportId: "older",
    date: "2026-08-04",
    name: "Vitamin D (25-OH)",
    previous: null,
  });
  expect(data.attention.find((row) => row.markerKey === "vitamin_b12")).toMatchObject({
    reportId: "latest",
    date: "2026-09-15",
    value: 280,
    status: "watch",
    direction: "worsening",
    previous: { value: 450, date: "2026-08-04" },
  });
});

test("a ratio the lab reported carries its catalog description", async () => {
  store.reports.push(done("r", "2026-09-01", 60));
  store.markers.set("r", [marker("tc_hdl_ratio", 30, "risk")]);
  const data = await body();
  expect(data.moveFirst[0]?.description).toEqual(expect.any(String));
});

test("retest dates come from the collection date and the status, soonest first", async () => {
  store.reports.push(done("r", "2025-02-01", 60));
  store.markers.set("r", [
    marker("urine_acr", 40, "watch"),
    marker("hba1c", 8, "risk"),
    marker("ldl", 30, "risk"),
    marker("glucose", 15, "optimal"),
  ]);
  const data = await body();
  expect(data.retests).toEqual([
    { markerKey: "hba1c", name: "HbA1c", dueOn: "2025-05-03", measuredOn: "2025-02-01" },
    {
      markerKey: "urine_acr",
      name: "Urine albumin to creatinine ratio",
      dueOn: "2026-01-31",
      measuredOn: "2025-02-01",
    },
  ]);
});

test("a marker printed twice keeps its soonest retest date", async () => {
  store.reports.push(done("r", "2025-02-01", 60));
  store.markers.set("r", [marker("hba1c", 6, "watch"), marker("hba1c", 8, "risk")]);
  const data = await body();
  expect(data.retests).toEqual([
    { markerKey: "hba1c", name: "HbA1c", dueOn: "2025-05-03", measuredOn: "2025-02-01" },
  ]);
});

test("a marker the latest report did not measure keeps the retest date of its last value", async () => {
  store.reports.push(done("full", "2026-08-04", 70), done("glucose-only", "2026-10-06", 74));
  store.markers.set("full", [marker("hba1c", 8, "risk")]);
  store.markers.set("glucose-only", [marker("glucose_fasting", 95, "optimal")]);
  const data = await body();
  expect(data.retests).toEqual([
    { markerKey: "hba1c", name: "HbA1c", dueOn: "2026-11-03", measuredOn: "2026-08-04" },
  ]);
});

test("a newer value of a marker replaces the retest date of the older one", async () => {
  store.reports.push(done("old", "2026-02-03", 70), done("new", "2026-10-06", 74));
  store.markers.set("old", [marker("hba1c", 8, "risk")]);
  store.markers.set("new", [marker("hba1c", 6, "watch")]);
  const data = await body();
  expect(data.retests).toEqual([
    { markerKey: "hba1c", name: "HbA1c", dueOn: "2027-10-05", measuredOn: "2026-10-06" },
  ]);
});

test("a report with no collection date gives no retest date", async () => {
  store.reports.push({ ...done("r", "2025-02-01", 60), collectedAt: null });
  store.markers.set("r", [marker("hba1c", 8, "risk")]);
  const data = await body();
  expect(data.retests).toEqual([]);
});

test("reports still being read are counted", async () => {
  store.reports.push(
    { ...done("q", "2026-10-12", 0), status: "queued", score: null },
    { ...done("p", "2026-10-12", 0), status: "processing", score: null },
  );
  const data = await body();
  expect(data.processingCount).toBe(2);
  expect(data.latest).toBeNull();
});

/** Writes an older full panel with high homocysteine and low B12, and a newer report where homocysteine rose. */
function b12History() {
  store.reports.push(done("old", "2026-03-01", 70), done("new", "2026-09-01", 72));
  store.markers.set("old", [
    { ...marker("homocysteine", 15, "risk"), unit: "µmol/L", calibratedLow: 5, calibratedHigh: 10 },
    {
      ...marker("vitamin_b12", 300, "watch"),
      unit: "pg/mL",
      calibratedLow: 400,
      calibratedHigh: 900,
    },
  ]);
  store.markers.set("new", [
    { ...marker("homocysteine", 20, "risk"), unit: "µmol/L", calibratedLow: 5, calibratedHigh: 10 },
  ]);
}

test("suggestions carry the disclaimer and the value and report of each marker behind them", async () => {
  b12History();
  const { suggestions } = await body();
  expect(suggestions.length).toBeGreaterThan(0);
  for (const suggestion of suggestions) {
    expect(suggestion.disclaimer).toMatch(/^MediWise is for information\./);
  }
  expect(suggestions.flatMap(({ markers }) => markers)).toContainEqual(
    expect.objectContaining({ markerKey: "homocysteine", value: 20, reportId: "new" }),
  );
  expect(suggestions.flatMap(({ markers }) => markers)).toContainEqual(
    expect.objectContaining({ markerKey: "vitamin_b12", value: 300, reportId: "old" }),
  );
});

test("patterns match on the latest value of each marker across reports and say how they changed", async () => {
  b12History();
  const { patterns } = await body();
  expect(patterns).toContainEqual(
    expect.objectContaining({
      key: "b12_deficiency",
      name: "B12 deficiency pattern",
      change: "worsening",
      matched: [
        expect.objectContaining({ markerKey: "homocysteine", value: 20, reportId: "new" }),
        expect.objectContaining({ markerKey: "vitamin_b12", value: 300, reportId: "old" }),
      ],
    }),
  );
});

test("Accept-Language hi gives the suggestions and the pattern text in Hindi", async () => {
  b12History();
  const { suggestions, patterns } = await body("hi");
  const devanagari = /\p{Script=Devanagari}/u;
  expect(suggestions.every(({ title, disclaimer }) => devanagari.test(title + disclaimer))).toBe(
    true,
  );
  const b12 = patterns.find(({ key }) => key === "b12_deficiency");
  expect(b12?.name).toMatch(devanagari);
  expect(b12?.description).toMatch(devanagari);
});

test("the dashboard read never calls Claude", async () => {
  b12History();
  claude.create.mockClear();
  expect((await dashboard()).status).toBe(200);
  expect(claude.create).not.toHaveBeenCalled();
});

test("another user's profile answers 404", async () => {
  b12History();
  const res = await dashboard("mallory");
  expect(res.status).toBe(404);
  expect(JSON.stringify(await res.json())).not.toContain("b12_deficiency");
});

test("a missing profile id answers 400", async () => {
  expect((await app.request("/dashboard")).status).toBe(400);
});

test("the family lists each profile with its latest done report and its markers at risk", async () => {
  const self = { profileId: "p-self", name: "Arjun", relation: "self" as const };
  const parent = { profileId: "p-parent", name: "Meena", relation: "parent" as const };
  const child = { profileId: "p-child", name: "Kabir", relation: "child" as const };
  const report = (id: string, date: string, uploadedAt: string, score: number) => ({
    reportId: id,
    date,
    uploadedAt: new Date(uploadedAt),
    score,
    tier: "silver",
  });
  store.family.push(
    { ...self, ...report("self-old", "2026-03-12", "2026-03-14T10:00:00Z", 70) },
    { ...self, ...report("self-new", "2026-09-01", "2026-09-02T10:00:00Z", 74) },
    { ...parent, reportId: null, date: null, uploadedAt: null, score: null, tier: null },
    { ...child, ...report("child-old", "2025-02-10", "2025-02-11T10:00:00Z", 81) },
  );
  store.markers.set("self-old", [marker("ldl", 30, "risk")]);
  store.markers.set("self-new", [
    marker("hba1c", 40, "risk"),
    marker("tsh", 21, "risk"),
    marker("ldl", 22, "watch"),
  ]);
  store.markers.set("child-old", [marker("glucose", 15, "optimal")]);

  const res = await client.dashboard.family.$get();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual([
    {
      id: "p-self",
      name: "Arjun",
      relation: "self",
      typicalGapDays: null,
      latest: { id: "self-new", date: "2026-09-01", score: 74, tier: "silver", riskCount: 2 },
    },
    { id: "p-parent", name: "Meena", relation: "parent", typicalGapDays: null, latest: null },
    {
      id: "p-child",
      name: "Kabir",
      relation: "child",
      typicalGapDays: null,
      latest: { id: "child-old", date: "2025-02-10", score: 81, tier: "silver", riskCount: 0 },
    },
  ]);
});

test("two done reports from the same date pick the one uploaded last", async () => {
  const self = { profileId: "p-self", name: "Arjun", relation: "self" as const, tier: "gold" };
  store.family.push(
    {
      ...self,
      reportId: "late",
      date: "2026-09-01",
      uploadedAt: new Date("2026-09-03"),
      score: 72,
    },
    {
      ...self,
      reportId: "early",
      date: "2026-09-01",
      uploadedAt: new Date("2026-09-02"),
      score: 70,
    },
  );
  const [row] = await (await client.dashboard.family.$get()).json();
  expect(row?.latest?.id).toBe("late");
});

test("a profile with weekly reports has a typical gap of 7 days", async () => {
  const self = { profileId: "p-self", name: "Arjun", relation: "self" as const, tier: "gold" };
  const dates = [
    "2026-08-04",
    "2026-09-01",
    "2026-09-08",
    "2026-09-15",
    "2026-09-22",
    "2026-09-29",
  ];
  store.family.push(
    ...dates.map((date, i) => ({
      ...self,
      reportId: `r${i}`,
      date,
      uploadedAt: new Date(date),
      score: 70,
    })),
  );
  const [row] = await (await client.dashboard.family.$get()).json();
  expect(row?.typicalGapDays).toBe(7);
});

test("a profile with yearly reports has a typical gap of about a year", async () => {
  const self = { profileId: "p-self", name: "Arjun", relation: "self" as const, tier: "gold" };
  const dates = ["2024-02-10", "2025-02-08", "2026-02-14"];
  store.family.push(
    ...dates.map((date, i) => ({
      ...self,
      reportId: `r${i}`,
      date,
      uploadedAt: new Date(date),
      score: 70,
    })),
  );
  const [row] = await (await client.dashboard.family.$get()).json();
  expect(row?.typicalGapDays).toBe(371);
});
