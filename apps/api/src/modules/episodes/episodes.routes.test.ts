import { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { episodesRoutes, profileEpisodesRoutes, reportEpisodeRoutes } from "./episodes.routes.js";

const ids = vi.hoisted(() => ({
  profile: "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10",
  otherProfile: "6a1d7b9f-7d2b-4b4a-8d54-3d2a8d4f3b21",
  bobProfile: "7b2e8c0a-8e3c-4c5b-9e65-4e3b9e5a4c32",
  yearly: "e1000000-0000-4000-8000-000000000000",
  reports: [1, 2, 3, 4, 5].map((n) => `e1000000-0000-4000-8000-00000000000${n}`),
  sibling: "e1000000-0000-4000-8000-000000000009",
  bob: "e1000000-0000-4000-8000-000000000010",
  queued: "e1000000-0000-4000-8000-000000000011",
}));

const store = vi.hoisted(() => {
  type Report = {
    id: string;
    owner: string;
    profileId: string;
    status: string;
    date: string;
    episodeId: string | null;
  };
  type Episode = {
    id: string;
    profileId: string;
    name: string;
    startedOn: string;
    endedOn: string | null;
    note: string | null;
    summary: { hash: string; sentences: string[] | null } | null;
  };
  type Marker = { markerKey: string; value: number; unit: string; status: string };
  const reports: Report[] = [];
  const episodes: Episode[] = [];
  const markers = new Map<string, Marker[]>();
  const dismissed = new Map<string, string>();
  const owners: Record<string, string> = {};
  const create = vi.fn();
  const ownerOf = (profileId: string) => owners[profileId];
  return {
    reports,
    episodes,
    markers,
    dismissed,
    owners,
    create,
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        ownerOf(id) === owner ? { id, isSelf: true } : undefined,
    },
    findingsRepo: {
      findVisit: async (reportId: string) => {
        const report = reports.find(({ id }) => id === reportId)!;
        return {
          profileId: report.profileId,
          patterns: [],
          visit: {
            date: report.date,
            labName: "Made-up Diagnostics",
            markers: (markers.get(reportId) ?? []).map((row) => ({
              ...row,
              valueText: null,
              calibratedLow: 0.5,
              calibratedHigh: 2.5,
            })),
            studies: [],
          },
        };
      },
    },
    repo: {
      listEpisodes: async (profileId: string) =>
        episodes
          .filter((episode) => episode.profileId === profileId)
          .map(({ id, name, startedOn, endedOn, note }) => ({
            id,
            name,
            startedOn,
            endedOn,
            note,
            reportIds: reports.filter((r) => r.episodeId === id).map((r) => r.id),
          })),
      listFreeReports: async (profileId: string) =>
        reports
          .filter((r) => r.profileId === profileId && r.status === "done" && !r.episodeId)
          .map(({ id, date }) => ({ id, date })),
      findDismissedOn: async (profileId: string) => dismissed.get(profileId) ?? null,
      saveDismissedOn: async (profileId: string, date: string) => {
        dismissed.set(profileId, date);
      },
      listOwnedReports: async (owner: string, wanted: string[]) =>
        reports.filter((r) => wanted.includes(r.id) && r.owner === owner),
      insertEpisode: async (
        row: Pick<Episode, "profileId" | "name" | "note" | "startedOn">,
        reportIds: string[],
      ) => {
        const id = `f0000000-0000-4000-8000-00000000000${episodes.length + 1}`;
        episodes.push({ ...row, id, endedOn: null, summary: null });
        for (const report of reports.filter((r) => reportIds.includes(r.id))) {
          report.episodeId = id;
        }
        return { id };
      },
      findOwnedEpisode: async (owner: string, id: string) => {
        const episode = episodes.find((row) => row.id === id);
        return episode && ownerOf(episode.profileId) === owner ? { ...episode } : undefined;
      },
      updateEpisode: async (id: string, patch: Partial<Episode>) => {
        const episode = episodes.find((row) => row.id === id)!;
        for (const [key, value] of Object.entries(patch)) {
          if (value !== undefined) Object.assign(episode, { [key]: value });
        }
      },
      deleteEpisode: async (id: string) => {
        episodes.splice(
          episodes.findIndex((row) => row.id === id),
          1,
        );
        for (const report of reports.filter((r) => r.episodeId === id)) report.episodeId = null;
      },
      listEpisodeReports: async (episodeId: string) =>
        reports
          .filter((r) => r.episodeId === episodeId && r.status === "done")
          .toSorted((a, b) => a.date.localeCompare(b.date))
          .map(({ id }) => ({ id })),
      setReportEpisode: async (reportId: string, episode: { id: string; date: string } | null) => {
        reports.find((r) => r.id === reportId)!.episodeId = episode?.id ?? null;
        const target = episodes.find((row) => row.id === episode?.id);
        if (target && episode && episode.date < target.startedOn) target.startedOn = episode.date;
      },
      saveSummary: async (id: string, summary: Episode["summary"]) => {
        episodes.find((row) => row.id === id)!.summary = summary;
      },
    },
  };
});

vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../findings/findings.repo.js", () => store.findingsRepo);
vi.mock("./episodes.repo.js", () => store.repo);
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: store.create } } }));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/profiles", profileEpisodesRoutes)
  .route("/episodes", episodesRoutes)
  .route("/reports", reportEpisodeRoutes)
  .onError(handleError);

type Body = {
  id: string;
  episodeId: string | null;
  episodes: object[];
  proposal: { to: string } | null;
  timeline: { date: string }[];
  repeated: object[];
  summary: string[];
};

async function call(method: string, path: string, body?: unknown, user = "alice") {
  const res = await app.request(path, {
    method,
    headers: { "content-type": "application/json", "x-user": user },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: (res.status === 204 ? {} : await res.json()) as Body };
}

function summary(sentences: { text: string; citedKeys: string[] }[]) {
  return {
    content: [{ type: "tool_use", id: "toolu_1", name: "write_summary", input: { sentences } }],
    stop_reason: "tool_use",
    usage: { input_tokens: 1200, output_tokens: 90 },
  };
}

const goodSummary = [
  { text: "This episode has five reports over six weeks.", citedKeys: [] },
  { text: "TSH moved from risk status to optimal status.", citedKeys: ["tsh"] },
];
const dates = ["2025-02-03", "2025-02-10", "2025-02-24", "2025-03-03", "2025-03-17"];
const tsh = [4.6, 3.9, 3.1, 2.8, 2.4];
const note = "Made-up private reason the doctor gave";

function report(id: string, date: string, extra: Partial<(typeof store.reports)[number]> = {}) {
  return {
    id,
    owner: "alice",
    profileId: ids.profile,
    status: "done",
    date,
    episodeId: null,
    ...extra,
  };
}

async function createWorkup() {
  const { body } = await call("POST", `/profiles/${ids.profile}/episodes`, {
    name: "Thyroid workup",
    note,
    reportIds: ids.reports,
  });
  return body.id as string;
}

beforeEach(() => {
  store.reports.splice(0);
  store.episodes.splice(0);
  store.markers.clear();
  store.dismissed.clear();
  Object.assign(store.owners, {
    [ids.profile]: "alice",
    [ids.otherProfile]: "alice",
    [ids.bobProfile]: "bob",
  });
  store.create.mockReset();
  store.create.mockResolvedValue(summary(goodSummary));
  store.reports.push(
    report(ids.yearly, "2024-09-10"),
    ...ids.reports.map((id, index) => report(id, dates[index]!)),
    report(ids.sibling, "2025-03-01", { profileId: ids.otherProfile }),
    report(ids.bob, "2025-03-01", { owner: "bob", profileId: ids.bobProfile }),
    report(ids.queued, "2025-03-20", { status: "queued" }),
  );
  ids.reports.forEach((id, index) =>
    store.markers.set(id, [
      {
        markerKey: "tsh",
        value: tsh[index]!,
        unit: "µIU/mL",
        status: index < 2 ? "risk" : "watch",
      },
    ]),
  );
});

describe("proposal", () => {
  test("five done reports in six weeks give a proposal without the yearly report", async () => {
    const { status, body } = await call("GET", `/profiles/${ids.profile}/episodes`);
    expect(status).toBe(200);
    expect(body).toEqual({
      episodes: [],
      proposal: { reportIds: ids.reports, from: "2025-02-03", to: "2025-03-17" },
    });
  });

  test("a named proposal becomes an open episode that starts on its oldest report, and the proposal goes", async () => {
    const id = await createWorkup();
    const { body } = await call("GET", `/profiles/${ids.profile}/episodes`);
    expect(body.proposal).toBeNull();
    expect(body.episodes).toEqual([
      {
        id,
        name: "Thyroid workup",
        startedOn: "2025-02-03",
        endedOn: null,
        note,
        reportIds: ids.reports,
      },
    ]);
  });

  test("a dismissed proposal stays hidden until a later report joins the run", async () => {
    const dismissed = await call("POST", `/profiles/${ids.profile}/episodes/dismiss`);
    expect(dismissed.body.proposal).toBeNull();
    store.reports.push(report("e1000000-0000-4000-8000-000000000012", "2025-03-30"));
    const { body } = await call("GET", `/profiles/${ids.profile}/episodes`);
    expect(body.proposal?.to).toBe("2025-03-30");
  });
});

describe("ownership", () => {
  test("another user's profile, episode or report answers 404", async () => {
    const id = await createWorkup();
    expect((await call("GET", `/profiles/${ids.profile}/episodes`, undefined, "bob")).status).toBe(
      404,
    );
    expect((await call("GET", `/episodes/${id}`, undefined, "bob")).status).toBe(404);
    expect((await call("PATCH", `/episodes/${id}`, { name: "Mine" }, "bob")).status).toBe(404);
    expect((await call("DELETE", `/episodes/${id}`, undefined, "bob")).status).toBe(404);
    expect((await call("PUT", `/reports/${ids.bob}/episode`, { episodeId: id })).status).toBe(404);
    const steal = await call("POST", `/profiles/${ids.profile}/episodes`, {
      name: "Workup",
      reportIds: [ids.bob],
    });
    expect(steal.status).toBe(404);
  });

  test("a report of another person or an unread report cannot join an episode", async () => {
    const id = await createWorkup();
    const join = (reportId: string) =>
      call("PUT", `/reports/${reportId}/episode`, { episodeId: id });
    expect((await join(ids.sibling)).status).toBe(422);
    expect((await join(ids.queued)).status).toBe(422);
    expect(store.reports.find((r) => r.id === ids.sibling)?.episodeId).toBeNull();
  });
});

describe("episode page", () => {
  test("the page shows the timeline, the repeated markers with a direction, and the summary", async () => {
    const id = await createWorkup();
    const { status, body } = await call("GET", `/episodes/${id}`);
    expect(status).toBe(200);
    expect(body.timeline.map((row) => row.date)).toEqual(dates);
    expect(body.repeated).toMatchObject([
      { markerKey: "tsh", direction: "improving", points: tsh.map((value) => ({ value })) },
    ]);
    expect(body.summary).toEqual(goodSummary.map(({ text }) => text));
  });

  test("the note and the episode name never reach the prompt", async () => {
    const id = await createWorkup();
    await call("GET", `/episodes/${id}`);
    const prompt = JSON.stringify(store.create.mock.calls);
    expect(store.create).toHaveBeenCalledTimes(1);
    expect(prompt).toContain("tsh | Thyroid stimulating hormone");
    expect(prompt).not.toContain(note);
    expect(prompt).not.toContain("Thyroid workup");
  });

  test("a second open with the same facts uses the cached summary and makes no call", async () => {
    const id = await createWorkup();
    await call("GET", `/episodes/${id}`);
    await call("PATCH", `/episodes/${id}`, { note: "Another made-up reason" });
    const { body } = await call("GET", `/episodes/${id}`);
    expect(store.create).toHaveBeenCalledTimes(1);
    expect(body.summary).toEqual(goodSummary.map(({ text }) => text));
  });

  test("a summary that suggests a test twice falls back to the engine text", async () => {
    store.create.mockResolvedValue(
      summary([{ text: "Retest TSH in six weeks.", citedKeys: ["tsh"] }]),
    );
    const id = await createWorkup();
    const { body } = await call("GET", `/episodes/${id}`);
    expect(store.create).toHaveBeenCalledTimes(2);
    expect(body.summary).toEqual([
      "This episode has 5 reports over 42 days.",
      "1 marker has more than one value.",
      "1 of them is improving.",
    ]);
  });
});

describe("changes", () => {
  test("an episode ends, opens again, and rejects an end date before its start", async () => {
    const id = await createWorkup();
    expect((await call("PATCH", `/episodes/${id}`, { endedOn: "2025-03-17" })).status).toBe(200);
    expect(store.episodes[0]?.endedOn).toBe("2025-03-17");
    expect((await call("PATCH", `/episodes/${id}`, { endedOn: "2025-01-01" })).status).toBe(422);
    await call("PATCH", `/episodes/${id}`, { endedOn: null });
    expect(store.episodes[0]?.endedOn).toBeNull();
  });

  test("a note over 200 characters is rejected", async () => {
    const res = await call("POST", `/profiles/${ids.profile}/episodes`, {
      name: "Workup",
      note: "a".repeat(201),
      reportIds: ids.reports,
    });
    expect(res.status).toBe(400);
  });

  test("a report leaves its episode, joins it again, and an older report moves the start back", async () => {
    const id = await createWorkup();
    const path = `/reports/${ids.reports[0]}/episode`;
    expect((await call("PUT", path, { episodeId: null })).body).toEqual({ episodeId: null });
    expect(store.reports.find((r) => r.id === ids.reports[0])?.episodeId).toBeNull();
    await call("PUT", path, { episodeId: id });
    await call("PUT", `/reports/${ids.yearly}/episode`, { episodeId: id });
    expect(store.episodes[0]?.startedOn).toBe("2024-09-10");
  });

  test("a deleted episode frees its reports", async () => {
    const id = await createWorkup();
    expect((await call("DELETE", `/episodes/${id}`)).status).toBe(204);
    expect(store.reports.every((r) => r.episodeId === null)).toBe(true);
    expect((await call("GET", `/episodes/${id}`)).status).toBe(404);
  });
});
