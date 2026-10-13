import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { linksRoutes } from "./links.routes.js";

const store = vi.hoisted(() => {
  type Report = { id: string; owner: string; profileId: string; status: string; date: string };
  type Link = {
    id: string;
    earlierReportId: string;
    laterReportId: string;
    kind: string;
    createdBy: string;
    state: string;
  };
  const reports: Report[] = [];
  const links: Link[] = [];
  const touches = (link: Link, reportId: string) =>
    link.earlierReportId === reportId || link.laterReportId === reportId;
  return {
    reports,
    links,
    repo: {
      findOwnedReport: async (owner: string, id: string) => {
        const report = reports.find((row) => row.id === id && row.owner === owner);
        return report && { ...report, createdAt: new Date(`${report.date}T10:00:00Z`) };
      },
      upsertUserLink: async (row: Omit<Link, "id" | "createdBy" | "state">) => {
        const found = links.find(
          (link) =>
            link.earlierReportId === row.earlierReportId &&
            link.laterReportId === row.laterReportId,
        );
        const link = Object.assign(found ?? { id: `link-${links.length + 1}` }, row, {
          createdBy: "user",
          state: "confirmed",
        }) as Link;
        if (!found) links.push(link);
        return link;
      },
      updateLinkState: async (reportId: string, id: string, state: string) => {
        const link = links.find((row) => row.id === id && touches(row, reportId));
        if (link) link.state = state;
        return link;
      },
      listLinks: async (reportId: string) =>
        links
          .filter((link) => link.state !== "dismissed" && touches(link, reportId))
          .map((link) => {
            const id =
              link.earlierReportId === reportId ? link.laterReportId : link.earlierReportId;
            const other = reports.find((report) => report.id === id)!;
            return { ...link, other: { id, labName: null, date: other.date } };
          }),
    },
  };
});

vi.mock("./links.repo.js", () => store.repo);

const ids = {
  first: "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c01",
  second: "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c02",
  other: "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c03",
  bob: "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c04",
  queued: "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c05",
};
const linkId = "6c1e2a9b-3f4d-4b5a-8c7d-1e2f3a4b5c99";

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", "alice");
    await next();
  })
  .route("/reports", linksRoutes)
  .onError(handleError);

function call(method: string, path: string, body?: unknown) {
  return app.request(path, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  store.links.length = 0;
  store.reports.length = 0;
  store.reports.push(
    { id: ids.first, owner: "alice", profileId: "p1", status: "done", date: "2025-02-10" },
    { id: ids.second, owner: "alice", profileId: "p1", status: "done", date: "2025-03-24" },
    { id: ids.other, owner: "alice", profileId: "p2", status: "done", date: "2025-03-01" },
    { id: ids.bob, owner: "bob", profileId: "p3", status: "done", date: "2025-03-01" },
    { id: ids.queued, owner: "alice", profileId: "p1", status: "queued", date: "2025-04-01" },
  );
});

test("a link made from the later report puts the two reports in visit order, confirmed", async () => {
  const res = await call("POST", `/reports/${ids.second}/links`, {
    reportId: ids.first,
    kind: "second_opinion",
  });

  expect(res.status).toBe(201);
  expect(await res.json()).toEqual([
    {
      id: "link-1",
      kind: "second_opinion",
      state: "confirmed",
      createdBy: "user",
      role: "later",
      other: { id: ids.first, labName: null, date: "2025-02-10" },
    },
  ]);
  expect(store.links[0]).toMatchObject({ earlierReportId: ids.first, laterReportId: ids.second });
});

test("a link to another user's report returns 404, to another person or an unread report 422", async () => {
  const link = (reportId: string) =>
    call("POST", `/reports/${ids.first}/links`, { reportId, kind: "repeat" });
  expect((await link(ids.bob)).status).toBe(404);
  expect((await link(ids.other)).status).toBe(422);
  expect((await link(ids.queued)).status).toBe(422);
  expect((await link(ids.first)).status).toBe(422);
  expect(store.links).toEqual([]);
});

test("a proposed link is confirmed, then dismissed, and leaves the report's link list", async () => {
  store.links.push({
    id: linkId,
    earlierReportId: ids.first,
    laterReportId: ids.second,
    kind: "repeat",
    createdBy: "detector",
    state: "proposed",
  });
  const path = `/reports/${ids.second}/links/${linkId}`;

  const confirmed = await call("PATCH", path, { state: "confirmed" });
  expect(((await confirmed.json()) as object[])[0]).toMatchObject({ state: "confirmed", role: "later" });

  const dismissed = await call("PATCH", path, { state: "dismissed" });
  expect(await dismissed.json()).toEqual([]);
});

test("a link of another report or another user returns 404, and an unknown state 400", async () => {
  store.links.push({
    id: linkId,
    earlierReportId: ids.first,
    laterReportId: ids.second,
    kind: "repeat",
    createdBy: "detector",
    state: "proposed",
  });
  expect(
    (await call("PATCH", `/reports/${ids.other}/links/${linkId}`, { state: "dismissed" })).status,
  ).toBe(404);
  expect(
    (await call("PATCH", `/reports/${ids.bob}/links/${linkId}`, { state: "dismissed" })).status,
  ).toBe(404);
  expect(
    (await call("PATCH", `/reports/${ids.first}/links/${linkId}`, { state: "proposed" })).status,
  ).toBe(400);
  expect(store.links[0]?.state).toBe("proposed");
});
