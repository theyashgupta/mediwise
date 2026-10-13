import { createHash } from "node:crypto";
import { Hono } from "hono";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { sharedExportRoutes, sharesRoutes } from "./shares.routes.js";

const ids = vi.hoisted(() => ({
  profile: "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10",
  done: "0b6f1f9e-3f57-4a0e-9a53-6f6b1d2c9e01",
  queued: "0b6f1f9e-3f57-4a0e-9a53-6f6b1d2c9e02",
}));

const store = vi.hoisted(() => {
  type Share = {
    id: string;
    reportId: string;
    ownerUserId: string;
    tokenHash: string;
    expiresAt: Date;
    endedAt: Date | null;
    createdAt: Date;
  };
  const shares: Share[] = [];
  const opens: { shareId: string; openedAt: Date }[] = [];
  const reports = [
    { id: ids.done, owner: "alice", status: "done" },
    { id: ids.queued, owner: "alice", status: "queued" },
  ];
  const isOpen = (share: Share) => share.endedAt === null && share.expiresAt > new Date();
  const findReport = (owner: string, id: string) =>
    reports.find((report) => report.id === id && report.owner === owner);
  return {
    shares,
    opens,
    sharesRepo: {
      insertShare: async (share: Omit<Share, "id" | "endedAt" | "createdAt">) => {
        const row = { ...share, id: crypto.randomUUID(), endedAt: null, createdAt: new Date() };
        shares.push(row);
        return { id: row.id, expiresAt: row.expiresAt };
      },
      listOpenShares: async (owner: string, reportId: string) =>
        shares
          .filter((s) => s.ownerUserId === owner && s.reportId === reportId && isOpen(s))
          .map((s) => {
            const seen = opens.filter((open) => open.shareId === s.id);
            return {
              id: s.id,
              createdAt: s.createdAt,
              expiresAt: s.expiresAt,
              openCount: seen.length,
              lastOpenedAt: seen.at(-1)?.openedAt ?? null,
            };
          }),
      endShare: async (owner: string, reportId: string, id: string) => {
        const share = shares.find(
          (s) => s.id === id && s.reportId === reportId && s.ownerUserId === owner && !s.endedAt,
        );
        if (share) share.endedAt = new Date();
        return Boolean(share);
      },
      findOpenShare: async (tokenHash: string) =>
        shares.find((s) => s.tokenHash === tokenHash && isOpen(s)),
      insertShareOpen: async (shareId: string) => {
        opens.push({ shareId, openedAt: new Date() });
      },
    },
    reportsRepo: {
      findReportById: async (owner: string, id: string) => {
        const report = findReport(owner, id);
        return (
          report && {
            ...report,
            profileId: ids.profile,
            labName: "Made-up Labs",
            collectedAt: "2026-09-01",
            reportedAt: "2026-09-02",
            note: "Started walking daily.",
            createdAt: new Date("2026-09-02T00:00:00Z"),
            markerCount: 0,
          }
        );
      },
      listReportFiles: async () => [
        {
          id: "file-1",
          name: "Arjun Mehta x-ray.jpg",
          pageClasses: ["raw_image"],
          skipReason: null,
        },
      ],
      listStudies: async () => [],
      listReportMarkers: async () => [],
      listFollowUps: async () => [],
      findReportInsights: async () => undefined,
    },
    findingsRepo: { listFindings: async () => [], findVisit: async () => undefined },
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owner === "alice" && id === ids.profile
          ? { id, name: "Arjun Mehta", dateOfBirth: "1990-05-20", sex: "male" }
          : undefined,
    },
    trendsRepo: {
      findReportProfileId: async (owner: string, id: string) =>
        findReport(owner, id) && ids.profile,
      listDoneReports: async () => [
        {
          id: ids.done,
          labName: "Made-up Labs",
          collectedAt: "2026-09-01",
          createdAt: new Date("2026-09-02T00:00:00Z"),
          score: 80,
          tier: "gold",
        },
      ],
      listMarkerRows: async () => [],
    },
  };
});

vi.mock("./shares.repo.js", () => store.sharesRepo);
vi.mock("../reports/reports.repo.js", () => store.reportsRepo);
vi.mock("../findings/findings.repo.js", () => store.findingsRepo);
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../trends/trends.repo.js", () => store.trendsRepo);
vi.mock("../links/links.repo.js", () => ({
  listProfileLinks: async () => [],
  listLinks: async () => [],
  listReportsAfter: async () => [],
}));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/reports", sharesRoutes);
app.onError(handleError);

const appWithoutSession = new Hono().route("/share", sharedExportRoutes);
appWithoutSession.onError(handleError);

const dayMs = 24 * 60 * 60 * 1000;

function call(method: string, path: string, user = "alice", body?: object) {
  return app.request(path, {
    method,
    headers: { "x-user": user, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
}

async function share(body: object = {}) {
  const res = await call("POST", `/reports/${ids.done}/share`, "alice", body);
  return { res, body: (await res.json()) as { id: string; token: string; expiresAt: string } };
}

const open = (token: string) => appWithoutSession.request(`/share/${token}`);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-13T06:00:00Z"));
  store.shares.length = 0;
  store.opens.length = 0;
});

afterEach(() => {
  vi.useRealTimers();
});

test("a share token is 32 random bytes in base64url and only its hash is stored", async () => {
  const one = await share();
  const two = await share();
  expect(one.res.status).toBe(201);
  expect(one.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(Buffer.from(one.body.token, "base64url")).toHaveLength(32);
  expect(one.body.token).not.toBe(two.body.token);
  expect(store.shares[0]?.tokenHash).toBe(
    createHash("sha256").update(one.body.token).digest("hex"),
  );
  expect(JSON.stringify(store.shares)).not.toContain(one.body.token);
});

test("a link ends after 7 days by default, at most after 30 days, and 0 or 31 days is refused", async () => {
  const now = Date.now();
  expect(new Date((await share()).body.expiresAt).getTime()).toBe(now + 7 * dayMs);
  expect(new Date((await share({ days: 30 })).body.expiresAt).getTime()).toBe(now + 30 * dayMs);
  expect((await share({ days: 31 })).res.status).toBe(400);
  expect((await share({ days: 0 })).res.status).toBe(400);
});

test("a report that is not read yet cannot be shared", async () => {
  const res = await call("POST", `/reports/${ids.queued}/share`, "alice", {});
  expect(res.status).toBe(409);
});

test("an open link returns the export without a session and counts each open", async () => {
  const { body } = await share();

  const res = await open(body.token);
  await open(body.token);

  expect(res.status).toBe(200);
  expect(res.headers.get("Cache-Control")).toBe("no-store");
  expect(res.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
  expect(await res.json()).toMatchObject({
    expiresAt: body.expiresAt,
    person: { firstName: "Arjun", age: 36 },
    report: {
      header: { labName: "Made-up Labs", collectedAt: "2026-09-01" },
      note: "Started walking daily.",
    },
    earlier: [],
  });
  const links = await (await call("GET", `/reports/${ids.done}/share`)).json();
  expect(links).toEqual([expect.objectContaining({ id: body.id, openCount: 2 })]);
});

test("the shared export never carries the full name, the date of birth or a file name", async () => {
  const { body } = await share();
  const text = await (await open(body.token)).text();
  expect(text).not.toContain("Mehta");
  expect(text).not.toContain("1990-05-20");
  expect(text).toContain('"images":["Image 1"]');
});

test("a link answers 404 after it expires", async () => {
  const { body } = await share({ days: 1 });
  vi.setSystemTime(Date.now() + dayMs + 1);
  expect((await open(body.token)).status).toBe(404);
  expect(await (await call("GET", `/reports/${ids.done}/share`)).json()).toEqual([]);
});

test("a link the owner ends early answers 404 and leaves the open list", async () => {
  const { body } = await share();
  expect((await open(body.token)).status).toBe(200);

  const res = await call("DELETE", `/reports/${ids.done}/share/${body.id}`);

  expect(res.status).toBe(204);
  expect((await open(body.token)).status).toBe(404);
  expect(await (await call("GET", `/reports/${ids.done}/share`)).json()).toEqual([]);
  expect((await call("DELETE", `/reports/${ids.done}/share/${body.id}`)).status).toBe(404);
});

test("an unknown token answers 404", async () => {
  expect((await open("not-a-real-token")).status).toBe(404);
});

test("another user cannot list, make or end the links of a report", async () => {
  const { body } = await share();
  expect((await call("GET", `/reports/${ids.done}/share`, "bob")).status).toBe(404);
  expect((await call("POST", `/reports/${ids.done}/share`, "bob", {})).status).toBe(404);
  expect((await call("DELETE", `/reports/${ids.done}/share/${body.id}`, "bob")).status).toBe(404);
  expect((await open(body.token)).status).toBe(200);
});
