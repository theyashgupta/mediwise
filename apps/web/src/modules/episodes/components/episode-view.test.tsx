import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import type { EpisodeDetail } from "../types";
import { EpisodeView } from "./episode-view";

vi.mock(import("@tanstack/react-router"), async (importOriginal) => ({
  ...(await importOriginal()),
  Link: (({ children }: { children: string }) => <a href="/">{children}</a>) as never,
}));

const dates = ["2025-02-03", "2025-02-10", "2025-02-24", "2025-03-03", "2025-03-17"];
const tsh = [
  { value: 4.6, status: "risk" },
  { value: 3.9, status: "watch" },
  { value: 2.4, status: "optimal" },
] as const;

const episode: EpisodeDetail = {
  id: "e1",
  profileId: "p1",
  name: "Thyroid tests",
  startedOn: "2025-02-03",
  endedOn: null,
  note: "Made-up private reason",
  from: "2025-02-03",
  to: "2025-03-17",
  timeline: dates.map((date, index) => ({
    reportId: `r${index}`,
    date,
    labName: index === 1 ? null : "Made-up Diagnostics",
    title: index === 1 ? "10 Feb 2025 · ultrasound" : null,
    markerCount: index === 1 ? 0 : 4,
    flaggedCount: index === 1 ? 0 : 2,
    studies: index === 1 ? [{ kind: "ultrasound", bodyRegion: "Pelvis" }] : [],
  })),
  repeated: [
    {
      markerKey: "tsh",
      name: "Thyroid stimulating hormone",
      unit: "µIU/mL",
      precision: 2,
      points: tsh.map((point, index) => ({ reportId: `r${index}`, date: dates[index]!, ...point })),
      direction: "improving",
    },
  ],
  studies: [
    {
      studyId: "s1",
      reportId: "r1",
      date: "2025-02-10",
      kind: "ultrasound",
      bodyRegion: "Pelvis",
      impression: "A 34 mm simple cyst in the left ovary.",
    },
  ],
  outstanding: {
    markers: [
      {
        markerKey: "hba1c",
        name: "HbA1c",
        unit: "%",
        precision: 1,
        reportId: "r3",
        date: "2025-03-03",
        value: 5.6,
        valueText: null,
        status: "watch",
      },
    ],
    studies: [],
  },
  summary: ["This episode has 5 reports over 42 days.", "1 marker has more than one value."],
};

test("the page shows the summary, every report in date order, the repeated marker and its first-to-last change", () => {
  const html = renderToStaticMarkup(<EpisodeView episode={episode} />);
  expect(html).toContain("This episode has 5 reports over 42 days.");
  expect(html.indexOf("3 Feb 2025")).toBeLessThan(html.indexOf("17 Mar 2025"));
  expect(html).toContain("4 markers, 2 with watch or risk status");
  expect(html).toContain("Ultrasound, Pelvis");
  expect(html).toContain(">10 Feb 2025 · ultrasound</a>");
  expect(html).not.toContain("Made-up Diagnostics");
  expect(html).toContain("4.6 → 3.9 → 2.4 µIU/mL");
  expect(html).toContain("Since the episode started");
  expect(html).toContain("Improving");
  expect(html).toContain("A 34 mm simple cyst in the left ovary.");
});

test("a marker with one value and watch status is listed as measured once", () => {
  const html = renderToStaticMarkup(<EpisodeView episode={episode} />);
  expect(html).toContain("Measured once");
  expect(html).toContain("HbA1c");
  expect(html).toContain("5.6 %");
});

test("an episode with no reports says how to add one, and shows no since-start list", () => {
  const html = renderToStaticMarkup(
    <EpisodeView
      episode={{
        ...episode,
        from: null,
        to: null,
        timeline: [],
        repeated: [],
        studies: [],
        outstanding: { markers: [], studies: [] },
      }}
    />,
  );
  expect(html).toContain("This episode has no reports.");
  expect(html).not.toContain("Since the episode started");
});
