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
  const family: FamilyRow[] = [];
  const owned = (owner: string, id: string) => owner === "alice" && id === profileId;
  const newestFirst = () => [...reports].sort((a, b) => b.date.localeCompare(a.date));
  return {
    reports,
    markers,
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

vi.mock("./dashboard.repo.js", () => store.repo);
vi.mock("../findings/findings.repo.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../findings/findings.repo.js")>()),
  listFindings: async (reportId: string) => findings.get(reportId) ?? [],
  findVisit: async () => undefined,
}));
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);

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

async function dashboard(user = "alice") {
  return client.dashboard.$get({ query: { profileId } }, { headers: { "x-user": user } });
}

async function body() {
  const res = await dashboard();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

beforeEach(() => {
  findings.clear();
  store.reports.length = 0;
  store.family.length = 0;
  store.markers.clear();
});

test("a profile with no reports gets an empty dashboard", async () => {
  const res = await dashboard();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    latest: null,
    newSince: [],
    moveFirst: [],
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

test("another user's profile answers 404", async () => {
  expect((await dashboard("mallory")).status).toBe(404);
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
