import { describe, expect, test } from "vitest";
import fixture from "../fixtures/episode-workup.json";
import { buildEpisode, type EpisodeVisit, proposeEpisode } from "./episode.js";

const visits = fixture.visits as EpisodeVisit[];
const dated = visits.map(({ reportId, date }) => ({ id: reportId, date }));

function on(...dates: string[]) {
  return dates.map((date, index) => ({ id: `r${index}`, date }));
}

describe("proposeEpisode", () => {
  test("five reports in six weeks are one proposal, and the yearly report before them stays out", () => {
    expect(proposeEpisode([fixture.yearly, ...dated])).toEqual({
      reportIds: dated.map(({ id }) => id),
      from: "2025-02-03",
      to: "2025-03-17",
    });
  });

  test("three reports 45 days apart from first to last are a proposal, 46 days are not", () => {
    expect(proposeEpisode(on("2025-01-01", "2025-01-20", "2025-02-15"))?.reportIds).toHaveLength(3);
    expect(proposeEpisode(on("2025-01-01", "2025-01-20", "2025-02-16"))).toBeUndefined();
  });

  test("two reports are never a proposal", () => {
    expect(proposeEpisode(on("2025-01-01", "2025-01-02"))).toBeUndefined();
  });

  test("three reports of one date are one visit, so a split yearly checkup is not a proposal", () => {
    expect(
      proposeEpisode(on("2025-02-01", "2025-02-01", "2025-02-01", "2025-02-20")),
    ).toBeUndefined();
  });

  test("overlapping windows join, so a workup longer than 45 days stays one proposal", () => {
    const reports = on("2025-01-01", "2025-01-21", "2025-02-10", "2025-03-02", "2025-03-22");
    expect(proposeEpisode(reports)?.reportIds).toEqual(["r0", "r1", "r2", "r3", "r4"]);
  });

  test("of two separate workups, the latest is the proposal", () => {
    const reports = on(
      "2025-01-01",
      "2025-01-10",
      "2025-01-20",
      "2025-06-01",
      "2025-06-10",
      "2025-06-20",
    );
    expect(proposeEpisode(reports)).toEqual({
      reportIds: ["r3", "r4", "r5"],
      from: "2025-06-01",
      to: "2025-06-20",
    });
  });
});

describe("buildEpisode", () => {
  const episode = buildEpisode(visits.toReversed());

  test("the timeline lists every report in date order with its counts and studies", () => {
    expect(episode.timeline.map(({ date }) => date)).toEqual([
      "2025-02-03",
      "2025-02-10",
      "2025-02-24",
      "2025-03-03",
      "2025-03-17",
    ]);
    expect(episode.timeline[0]).toMatchObject({ markerCount: 6, flaggedCount: 4, studies: [] });
    expect(episode.timeline[1]?.studies).toEqual([{ kind: "ultrasound", bodyRegion: "Pelvis" }]);
    expect({ from: episode.from, to: episode.to }).toEqual({
      from: "2025-02-03",
      to: "2025-03-17",
    });
  });

  test("a marker measured two times or more is repeated, with its values in order and a direction", () => {
    const repeated = Object.fromEntries(
      episode.repeated.map(({ markerKey, points, direction }) => [
        markerKey,
        { values: points.map(({ value }) => value), direction },
      ]),
    );
    expect(repeated).toEqual({
      tsh: { values: [4.6, 3.9, 2.4], direction: "improving" },
      testosterone_total: { values: [78, 64, 52], direction: "improving" },
      lh: { values: [14.2, 9.8], direction: "improving" },
      insulin_fasting: { values: [16, 13], direction: "improving" },
    });
  });

  test("a repeated marker keeps only the points in the unit of its latest point", () => {
    const [first, ...rest] = visits;
    const mixed = {
      ...first!,
      markers: first!.markers.map((row) =>
        row.markerKey === "lh" ? { ...row, value: 142, unit: "IU/L" } : row,
      ),
    };
    expect(buildEpisode([mixed, ...rest]).repeated.map(({ markerKey }) => markerKey)).not.toContain(
      "lh",
    );
  });

  test("the studies come in date order with their impressions", () => {
    expect(episode.studies.map(({ date, bodyRegion }) => `${date} ${bodyRegion}`)).toEqual([
      "2025-02-10 Pelvis",
      "2025-02-24 Neck",
      "2025-03-17 pelvis",
    ]);
    expect(episode.studies[0]?.impression).toContain("34 mm simple cyst");
  });

  test("a marker or study measured once with watch or risk status is outstanding, a repeated one is not", () => {
    expect(
      episode.outstanding.markers.map(({ markerKey, status }) => `${markerKey} ${status}`),
    ).toEqual(["anti_tpo risk", "hba1c watch"]);
    expect(episode.outstanding.studies).toEqual([
      {
        studyId: "e2000000-0000-4000-8000-000000000002",
        kind: "ultrasound",
        bodyRegion: "Neck",
        reportId: "e1000000-0000-4000-8000-000000000003",
        date: "2025-02-24",
        line: "A 6 mm nodule in the right lobe of the thyroid.",
      },
    ]);
  });

  test("an episode with no visits is empty", () => {
    expect(buildEpisode([])).toMatchObject({ from: null, to: null, timeline: [], repeated: [] });
  });
});
