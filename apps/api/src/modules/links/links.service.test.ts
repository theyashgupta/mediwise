import type { Visit } from "@mediwise/engine";
import { beforeEach, expect, test, vi } from "vitest";
import split from "../../../../../packages/engine/fixtures/repeat-study-split.json" with { type: "json" };
import { listReportLinks, proposeLinks } from "./links.service.js";

const store = vi.hoisted(() => {
  type Link = {
    id: string;
    earlierReportId: string;
    laterReportId: string;
    kind: string;
    createdBy: string;
    state: string;
  };
  const visits = new Map<string, { date: string; labName: string | null }>();
  const links: Link[] = [];
  return {
    visits,
    links,
    near: [] as { id: string; date: string; createdAt: Date }[],
    insertDetectedLinks: async (rows: Omit<Link, "id" | "createdBy" | "state">[]) => {
      for (const row of rows) {
        links.push({
          id: `link-${links.length + 1}`,
          createdBy: "detector",
          state: "confirmed",
          ...row,
        });
      }
    },
  };
});

vi.mock("./links.repo.js", () => ({
  listNearReports: async () => store.near,
  insertDetectedLinks: store.insertDetectedLinks,
  listLinks: async (reportId: string) =>
    store.links
      .filter((link) => link.earlierReportId === reportId || link.laterReportId === reportId)
      .map((link) => {
        const id = link.earlierReportId === reportId ? link.laterReportId : link.earlierReportId;
        return { ...link, other: { id, ...store.visits.get(id)! } };
      }),
}));

vi.mock("../findings/index.js", () => ({
  findVisit: async (id: string) => (id === earlierId ? { visit: earlier } : undefined),
}));

const earlierId = "2c7d9e10-4a5b-4c6d-8e7f-0a1b2c3d4e01";
const laterId = "2c7d9e10-4a5b-4c6d-8e7f-0a1b2c3d4e02";
const earlier = split.earlier as Visit;
const later = split.later as Visit;

beforeEach(() => {
  store.links.length = 0;
  store.visits.set(earlierId, { date: earlier.date, labName: earlier.labName });
  store.visits.set(laterId, { date: later.date, labName: later.labName });
  store.near = [{ id: earlierId, date: earlier.date, createdAt: new Date("2026-10-12T10:00:00Z") }];
});

const uploaded = { id: laterId, date: later.date, createdAt: new Date("2026-10-13T10:00:00Z") };

test("a TVS pelvis study 10 days after an abdomen and pelvis study links itself as a repeat on both reports", async () => {
  await proposeLinks("p1", uploaded, later);

  const link = { kind: "repeat", state: "confirmed", createdBy: "detector" };
  expect(await listReportLinks(earlierId)).toEqual([
    expect.objectContaining({
      ...link,
      role: "earlier",
      other: expect.objectContaining({ id: laterId }),
    }),
  ]);
  expect(await listReportLinks(laterId)).toEqual([
    expect.objectContaining({
      ...link,
      role: "later",
      other: expect.objectContaining({ id: earlierId }),
    }),
  ]);
});

test("a report with only a breast ultrasound does not link to a pelvis ultrasound", async () => {
  await proposeLinks("p1", uploaded, { ...later, studies: [later.studies[0]!] });
  expect(store.links).toEqual([]);
});

test("a pelvis ultrasound 100 days later does not link", async () => {
  const studies = [{ ...later.studies[1]!, performedAt: "2025-05-12" }];
  await proposeLinks("p1", { ...uploaded, date: "2025-05-12" }, { date: "2025-05-12", studies });
  expect(store.links).toEqual([]);
});
