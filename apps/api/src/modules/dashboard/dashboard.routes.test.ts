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
    date: string;
    score: number | null;
    tier: string | null;
    coverage: number | null;
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
  const reports: Report[] = [];
  const markers = new Map<string, Marker[]>();
  const owned = (owner: string, id: string) => owner === "alice" && id === profileId;
  const newestFirst = () => [...reports].sort((a, b) => b.date.localeCompare(a.date));
  return {
    reports,
    markers,
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
    },
  };
});

vi.mock("./dashboard.repo.js", () => store.repo);
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
    date,
    score,
    tier: "gold",
    coverage: 90,
  };
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
  store.reports.length = 0;
  store.markers.clear();
});

test("a profile with no reports gets an empty dashboard", async () => {
  const res = await dashboard();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ latest: null, moveFirst: [], recent: [], processingCount: 0 });
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
