import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { compareRoutes, trendsRoutes } from "./trends.routes.js";

const ids = vi.hoisted(() => ({
  profile: "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10",
  otherProfile: "6a1d7b9f-7d2b-4b4a-8d54-3d2a8d4f3b21",
  first: "0b4c2a51-1111-4e0f-9a51-6f2b8c1d0e01",
  second: "0b4c2a51-2222-4e0f-9a51-6f2b8c1d0e02",
  third: "0b4c2a51-3333-4e0f-9a51-6f2b8c1d0e03",
  stranger: "0b4c2a51-4444-4e0f-9a51-6f2b8c1d0e04",
}));

const store = vi.hoisted(() => {
  type Report = {
    id: string;
    profileId: string;
    collectedAt: string;
    labName?: string | null;
    episodeName?: string | null;
  };
  type Row = {
    reportId: string;
    markerKey: string | null;
    value: number | null;
    valueText?: string | null;
    unit: string | null;
    status: "optimal" | "watch" | "risk" | null;
    labRangeLow?: number | null;
    labRangeHigh?: number | null;
    calibratedLow?: number | null;
    calibratedHigh?: number | null;
  };
  const reports: Report[] = [];
  const rows: Row[] = [];
  const links: { earlierReportId: string; laterReportId: string }[] = [];
  const header = (report: Report) => ({
    labName: "Lab",
    episodeName: null,
    ...report,
    createdAt: new Date(`${report.collectedAt}T00:00:00Z`),
    score: 70,
    tier: "gold" as const,
  });
  const done = (owner: string, profileId: string) =>
    owner === "alice"
      ? reports
          .filter((report) => report.profileId === profileId)
          .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
      : [];
  return {
    reports,
    rows,
    links,
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owner === "alice" && (id === ids.profile || id === ids.otherProfile)
          ? { id, isSelf: id === ids.profile }
          : undefined,
    },
    repo: {
      listDoneReports: async (owner: string, profileId: string) =>
        done(owner, profileId).map(header),
      listMarkerRows: async (owner: string, profileId: string, markerKey?: string) => {
        const inProfile = new Set(done(owner, profileId).map((report) => report.id));
        return rows
          .filter((row) => inProfile.has(row.reportId))
          .filter((row) => (markerKey ? row.markerKey === markerKey : row.markerKey !== null))
          .map((row) => ({
            valueText: null,
            labRangeLow: null,
            labRangeHigh: null,
            calibratedLow: null,
            calibratedHigh: null,
            ...row,
          }));
      },
      findReportProfileId: async (owner: string, id: string) =>
        owner === "alice" ? reports.find((report) => report.id === id)?.profileId : undefined,
    },
  };
});

vi.mock("./trends.repo.js", () => store.repo);
vi.mock("../links/links.repo.js", () => ({
  listProfileLinks: async () => store.links,
  listLinks: async () => [],
  listReportsAfter: async () => [],
}));
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/trends", trendsRoutes)
  .route("/compare", compareRoutes);
app.onError(handleError);

const json = async (path: string, user = "alice") => {
  const res = await app.request(path, { headers: { "x-user": user } });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
};

beforeEach(() => {
  store.reports.splice(0, store.reports.length);
  store.rows.splice(0, store.rows.length);
  store.links.length = 0;
  store.reports.push(
    { id: ids.first, profileId: ids.profile, collectedAt: "2025-01-10" },
    { id: ids.second, profileId: ids.profile, collectedAt: "2025-07-10" },
    { id: ids.stranger, profileId: ids.otherProfile, collectedAt: "2025-08-01" },
  );
  store.rows.push(
    {
      reportId: ids.first,
      markerKey: "ldl_cholesterol",
      value: 160,
      unit: "mg/dL",
      status: "risk",
    },
    {
      reportId: ids.second,
      markerKey: "ldl_cholesterol",
      value: 120,
      unit: "mg/dL",
      status: "watch",
    },
    {
      reportId: ids.first,
      markerKey: "hdl_cholesterol",
      value: 50,
      unit: "mg/dL",
      status: "optimal",
    },
    {
      reportId: ids.second,
      markerKey: "hdl_cholesterol",
      value: 38,
      unit: "mg/dL",
      status: "watch",
    },
    { reportId: ids.first, markerKey: "sodium", value: 140, unit: "mmol/L", status: "optimal" },
    { reportId: ids.second, markerKey: "sodium", value: 140, unit: "mmol/L", status: "optimal" },
    { reportId: ids.first, markerKey: "hba1c", value: 5.4, unit: "%", status: "optimal" },
    { reportId: ids.second, markerKey: "ferritin", value: 80, unit: "ng/mL", status: "optimal" },
    { reportId: ids.second, markerKey: null, value: 3, unit: null, status: null },
  );
});

test("trends list every marker measured twice, with the change and a direction from the catalog", async () => {
  const { status, body } = await json(`/trends?profileId=${ids.profile}`);
  expect(status).toBe(200);
  expect(body.reportCount).toBe(2);
  const markers = body.markers as unknown as {
    markerKey: string;
    change: unknown;
    direction: string;
    latestStatus: string;
    points: unknown[];
  }[];
  expect(markers.map((marker) => marker.markerKey)).toEqual([
    "ldl_cholesterol",
    "hdl_cholesterol",
    "sodium",
  ]);
  const [ldl, hdl, sodium] = markers;
  expect(ldl).toMatchObject({
    change: { absolute: -40, percent: -25 },
    direction: "improving",
    latestStatus: "watch",
  });
  expect(hdl).toMatchObject({ change: { absolute: -12, percent: -24 }, direction: "worsening" });
  expect(sodium).toMatchObject({ change: { absolute: 0, percent: 0 }, direction: "stable" });
  expect(ldl?.points).toHaveLength(2);
});

test("a large move that stays inside the optimal range is stable and still shows the change", async () => {
  const optimal = (markerKey: string, unit: string, low: number | null, high: number) =>
    [ids.first, ids.second].map((reportId, index) => ({
      reportId,
      markerKey,
      value: { basophils_pct: [0.4, 0], iron: [158.6, 75] }[markerKey]?.[index] ?? null,
      unit,
      status: "optimal" as const,
      calibratedLow: low,
      calibratedHigh: high,
    }));
  store.rows.push(...optimal("basophils_pct", "%", null, 1), ...optimal("iron", "µg/dL", 65, 175));
  const { body } = await json(`/trends?profileId=${ids.profile}`);
  const markers = body.markers as unknown as { markerKey: string }[];
  expect(markers.find(({ markerKey }) => markerKey === "basophils_pct")).toMatchObject({
    change: { absolute: -0.4, percent: -100 },
    direction: "stable",
  });
  expect(markers.find(({ markerKey }) => markerKey === "iron")).toMatchObject({
    change: { absolute: -83.6, percent: -52.7 },
    direction: "stable",
  });
});

test("a point in another unit leaves the series, so values never mix units", async () => {
  store.reports.push({ id: ids.third, profileId: ids.profile, collectedAt: "2026-01-10" });
  store.rows.push({
    reportId: ids.third,
    markerKey: "ldl_cholesterol",
    value: 3.1,
    unit: "mmol/L",
    status: "watch",
  });
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  expect(body.unit).toBe("mmol/L");
  expect(body.points).toHaveLength(1);
});

test("a marker trend returns every point and the latest calibrated range", async () => {
  store.rows[1] = { ...store.rows[1]!, calibratedLow: null, calibratedHigh: 100 };
  const { status, body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  expect(status).toBe(200);
  expect(body).toMatchObject({
    name: expect.any(String),
    unit: "mg/dL",
    calibratedRange: { low: null, high: 100 },
    points: [
      { reportId: ids.first, value: 160, status: "risk" },
      { reportId: ids.second, value: 120, status: "watch" },
    ],
  });
});

test("a repeat within 30 days and a pair of linked reports mark their points as linked", async () => {
  store.reports.push({ id: ids.third, profileId: ids.profile, collectedAt: "2025-07-25" });
  store.rows.push({
    reportId: ids.third,
    markerKey: "ldl_cholesterol",
    value: 110,
    unit: "mg/dL",
    status: "watch",
  });
  const linked = async () => {
    const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
    return (body.points as { linked: boolean }[]).map((point) => point.linked);
  };

  expect(await linked()).toEqual([false, true, true]);
  store.links.push({ earlierReportId: ids.first, laterReportId: ids.second });
  expect(await linked()).toEqual([true, true, true]);
});

test("a point of a report inside an episode carries the episode name, the others carry null", async () => {
  store.reports.find((report) => report.id === ids.second)!.episodeName = "Thyroid workup";
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);

  expect((body.points as { episode: string | null }[]).map((point) => point.episode)).toEqual([
    null,
    "Thyroid workup",
  ]);
});

test("two reports with one collection date give one point, the newest value with its lab name", async () => {
  store.reports.push({
    id: ids.third,
    profileId: ids.profile,
    collectedAt: "2025-07-10",
    labName: "Second lab",
  });
  store.rows.push({
    reportId: ids.third,
    markerKey: "ldl_cholesterol",
    value: 110,
    unit: "mg/dL",
    status: "watch",
  });
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  expect(body.points).toMatchObject([
    { reportId: ids.first, value: 160, labName: "Lab" },
    { reportId: ids.third, value: 110, labName: "Second lab" },
  ]);
  expect(body.change).toEqual({ absolute: -50, percent: -31.3 });
});

test("a point is marked as a lab change only where its lab differs from the last named lab", async () => {
  store.reports.splice(0, 2);
  const labs = ["Lab A", " lab  a ", null, "Lab B", "Lab B"];
  labs.forEach((labName, index) => {
    const id = `0b4c2a51-5555-4e0f-9a51-6f2b8c1d0e1${index}`;
    store.reports.push({
      id,
      profileId: ids.profile,
      collectedAt: `2025-0${index + 1}-10`,
      labName,
    });
    store.rows.push({
      reportId: id,
      markerKey: "ldl_cholesterol",
      value: 100 + index,
      unit: "mg/dL",
      status: "optimal",
    });
  });
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  const points = body.points as { labChange: boolean }[];
  expect(points.map((point) => point.labChange)).toEqual([false, false, false, true, false]);
  expect(body.labCount).toBe(2);
});

test("each point carries the lab range and the optimal range of its own report", async () => {
  store.reports[1] = { ...store.reports[1]!, labName: "Second lab" };
  store.rows[0] = { ...store.rows[0]!, labRangeLow: null, labRangeHigh: 130 };
  store.rows[1] = {
    ...store.rows[1]!,
    labRangeLow: null,
    labRangeHigh: 100,
    calibratedLow: null,
    calibratedHigh: 90,
  };
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  expect(body.points).toMatchObject([
    { labName: "Lab", labChange: false, labRange: { low: null, high: 130 }, calibratedRange: null },
    {
      labName: "Second lab",
      labChange: true,
      labRange: { low: null, high: 100 },
      calibratedRange: { low: null, high: 90 },
    },
  ]);
  expect(body.labCount).toBe(2);
});

test("a series from one lab has no lab change and a lab count of one", async () => {
  const { body } = await json(`/trends/ldl_cholesterol?profileId=${ids.profile}`);
  const points = body.points as { labChange: boolean }[];
  expect(points.some((point) => point.labChange)).toBe(false);
  expect(body.labCount).toBe(1);
});

test("a marker without results, or not in the catalog, returns 404", async () => {
  expect((await json(`/trends/vitamin_d?profileId=${ids.profile}`)).status).toBe(404);
  expect((await json(`/trends/not_a_marker?profileId=${ids.profile}`)).status).toBe(404);
});

test("another user's profile returns 404 for trends", async () => {
  expect((await json(`/trends?profileId=${ids.profile}`, "bob")).status).toBe(404);
});

test("compare gives a verdict per marker and counts them", async () => {
  const { status, body } = await json(`/compare?a=${ids.first}&b=${ids.second}`);
  expect(status).toBe(200);
  expect(body.summary).toEqual({ improved: 1, worsened: 1, same: 1, new: 1, gone: 1 });
  const rows = (body.groups as unknown as { rows: { markerKey: string }[] }[]).flatMap(
    (group) => group.rows,
  );
  expect(rows).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        markerKey: "ldl_cholesterol",
        valueA: 160,
        valueB: 120,
        change: { absolute: -40, percent: -25 },
        verdictChange: "improved",
      }),
      expect.objectContaining({ markerKey: "hdl_cholesterol", verdictChange: "worsened" }),
      expect.objectContaining({ markerKey: "hba1c", valueB: null, verdictChange: "gone" }),
      expect.objectContaining({ markerKey: "ferritin", valueA: null, verdictChange: "new" }),
    ]),
  );
});

test("compare without ids uses the latest two reports, and with b alone the report before b", async () => {
  store.reports.push({ id: ids.third, profileId: ids.profile, collectedAt: "2026-01-10" });
  const latest = await json(`/compare?profileId=${ids.profile}`);
  expect(latest.body).toMatchObject({ a: { id: ids.second }, b: { id: ids.third } });
  const previous = await json(`/compare?b=${ids.second}`);
  expect(previous.body).toMatchObject({ a: { id: ids.first }, b: { id: ids.second } });
  const first = await json(`/compare?b=${ids.first}`);
  expect(first.body).toMatchObject({ a: null, b: { id: ids.first }, groups: [] });
});

test("compare gives a value from another unit only when the engine converts it", async () => {
  store.rows.splice(0, store.rows.length);
  store.rows.push(
    { reportId: ids.first, markerKey: "ldl_cholesterol", value: 4, unit: "mmol/L", status: null },
    { reportId: ids.second, markerKey: "ldl_cholesterol", value: 120, unit: "mg/dL", status: null },
    { reportId: ids.first, markerKey: "hdl_cholesterol", value: 50, unit: "mg%", status: null },
    { reportId: ids.second, markerKey: "hdl_cholesterol", value: 45, unit: "mg/dL", status: null },
  );
  const { body } = await json(`/compare?a=${ids.first}&b=${ids.second}`);
  const rows = (body.groups as unknown as { rows: { markerKey: string }[] }[]).flatMap(
    (group) => group.rows,
  );
  expect(rows).toEqual([
    expect.objectContaining({ markerKey: "ldl_cholesterol", valueA: 155, unit: "mg/dL" }),
    expect.objectContaining({ markerKey: "hdl_cholesterol", valueA: null, change: null }),
  ]);
});

test("compare returns 404 for reports of two profiles or of another owner", async () => {
  expect((await json(`/compare?a=${ids.stranger}&b=${ids.second}`)).status).toBe(404);
  expect((await json(`/compare?a=${ids.first}&b=${ids.second}`, "bob")).status).toBe(404);
});

test("compare without b or a profile returns 400", async () => {
  expect((await json(`/compare?a=${ids.first}`)).status).toBe(400);
});

test("study measurements and vitals trend in their own categories", async () => {
  store.rows.push(
    { reportId: ids.first, markerKey: "qtc_interval", value: 420, unit: "ms", status: "optimal" },
    { reportId: ids.second, markerKey: "qtc_interval", value: 433, unit: "ms", status: "optimal" },
    { reportId: ids.first, markerKey: "bmi", value: 25.1, unit: "kg/m²", status: "watch" },
    { reportId: ids.second, markerKey: "bmi", value: 26.5, unit: "kg/m²", status: "watch" },
  );

  const { body } = await json(`/trends?profileId=${ids.profile}`);

  expect(body.categories).toEqual(
    expect.arrayContaining([
      { key: "vitals", label: "Vitals" },
      { key: "studies", label: "Scans and ECG" },
    ]),
  );
  const markers = body.markers as unknown as { markerKey: string; category: string }[];
  expect(markers.filter((item) => ["vitals", "studies"].includes(item.category))).toEqual([
    expect.objectContaining({ markerKey: "bmi", category: "vitals" }),
    expect.objectContaining({ markerKey: "qtc_interval", category: "studies" }),
  ]);
  const { status } = await json(`/trends/qtc_interval?profileId=${ids.profile}`);
  expect(status).toBe(200);
});
