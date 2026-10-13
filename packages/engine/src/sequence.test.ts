import { describe, expect, test } from "vitest";
import split from "../fixtures/repeat-study-split.json";
import fixture from "../fixtures/repeat-study.json";
import { alertHeadlineStart, buildFindings } from "./findings.js";
import { repeatGap, repeatsMarker, settleFinding, typicalGapDays } from "./sequence.js";
import type { LaterVisit, Visit, VisitStudy } from "./types.js";

const earlier = fixture.earlier as Visit;
const later = fixture.later as LaterVisit;
const [earlierStudy] = earlier.studies;
const [laterStudy] = later.studies;
const alert = { kind: "study_alert" as const, citedKeys: [], citedStudyIds: [earlierStudy!.id] };

function laterWith(changes: Partial<LaterVisit>, impression?: string): LaterVisit {
  const studies = impression ? [{ ...laterStudy!, impression }] : later.studies;
  return { ...later, studies, ...changes };
}

describe("repeatsMarker", () => {
  test("in a weekly history only a recheck of a watch or risk value within 30 days is a repeat", () => {
    expect(repeatsMarker(7, "optimal", 7)).toBe(false);
    expect(repeatsMarker(7, "unknown", 7)).toBe(false);
    expect(repeatsMarker(7, "watch", 7)).toBe(true);
    expect(repeatsMarker(7, "risk", 7)).toBe(true);
    expect(repeatsMarker(31, "risk", 7)).toBe(false);
  });

  test("with a typical gap over 30 days or fewer than three dates, any value within 30 days is a repeat", () => {
    expect(repeatsMarker(15, "optimal", 31)).toBe(true);
    expect(repeatsMarker(15, "optimal", null)).toBe(true);
    expect(repeatsMarker(15, "optimal", 30)).toBe(false);
    expect(repeatsMarker(0, "risk", null)).toBe(false);
  });

  test("the typical gap is the median gap of the newest five report dates", () => {
    const weekly = [
      "2025-01-01",
      "2026-08-04",
      "2026-08-11",
      "2026-08-18",
      "2026-08-25",
      "2026-09-01",
    ];
    expect(typicalGapDays(weekly)).toBe(7);
    expect(typicalGapDays(["2026-08-04", "2026-08-11", "2026-08-11"])).toBeNull();
  });
});

describe("repeatGap", () => {
  test("a study of the same kind and region 42 days later is a repeat", () => {
    expect(repeatGap(earlier, later)).toBe(42);
  });

  test("a study 91 days later is not a repeat", () => {
    expect(repeatGap(earlier, laterWith({ date: "2025-05-12" }))).toBeUndefined();
  });

  test("a study 90 days earlier is a repeat, so an older report uploaded later still matches", () => {
    expect(repeatGap(earlier, laterWith({ date: "2024-11-12" }))).toBe(-90);
  });

  test("a study of another kind or another region is not a repeat", () => {
    const xray = { ...laterStudy!, kind: "xray" };
    const abdomen = { ...laterStudy!, bodyRegion: "Abdomen" };
    expect(repeatGap(earlier, { ...later, studies: [xray] })).toBeUndefined();
    expect(repeatGap(earlier, { ...later, studies: [abdomen] })).toBeUndefined();
  });

  test("a study with no printed region is not a repeat", () => {
    const studies = [{ ...earlierStudy!, bodyRegion: null }];
    expect(repeatGap({ ...earlier, studies }, later)).toBeUndefined();
  });
});

describe("a pelvis study printed differently from an earlier abdomen and pelvis study", () => {
  const before = split.earlier as Visit;
  const after = split.later as LaterVisit;
  const [breast, pelvis] = after.studies as [VisitStudy, VisitStudy];
  const pelvisAlert = { ...alert, citedStudyIds: [before.studies[0]!.id] };
  const only = (study: VisitStudy, changes: Partial<VisitStudy> = {}) => ({
    ...after,
    studies: [{ ...study, ...changes }],
  });

  test("the TVS pelvis study 10 days later repeats the abdomen and pelvis study", () => {
    expect(repeatGap(before, after)).toBe(10);
    expect(repeatGap(after, before)).toBe(-10);
  });

  test("the modality matches when one study prints USG and the other has the kind ultrasound", () => {
    expect(repeatGap(before, only(pelvis, { kind: "other" }))).toBe(10);
  });

  test("a breast study does not repeat a pelvis study", () => {
    expect(repeatGap(before, only(breast))).toBeUndefined();
  });

  test("a pelvis study of another modality does not repeat it", () => {
    expect(
      repeatGap(before, only(pelvis, { kind: "ct", bodyRegion: "CT pelvis" })),
    ).toBeUndefined();
  });

  test("a pelvis study 100 days later does not repeat it", () => {
    expect(repeatGap(before, only(pelvis, { performedAt: "2025-05-12" }))).toBeUndefined();
  });

  test("the pelvis study settles the alert with its own date and lab, not the breast study", () => {
    expect(settleFinding(pelvisAlert, before, [after])).toMatchObject({
      state: "settled",
      date: "2025-02-11",
      earlierDate: "2025-02-01",
      labName: "Hillside Scan Centre",
      later: "No adnexal mass is seen.",
    });
  });

  test("a study with its own lab names that lab on both lines, and a study whose file prints none names no lab", () => {
    const own = { ...after, studies: [breast, { ...pelvis, labName: "Riverside Scans" }] };
    const first = { ...before, studies: [{ ...before.studies[0]!, labName: "Lakeview Imaging" }] };
    expect(settleFinding(pelvisAlert, first, [own])).toMatchObject({
      earlierLabName: "Lakeview Imaging",
      labName: "Riverside Scans",
    });
    const unprinted = { ...after, studies: [breast, { ...pelvis, labName: null }] };
    expect(settleFinding(pelvisAlert, before, [unprinted])).toMatchObject({ labName: null });
  });
});

describe("settleFinding", () => {
  test("a linked later study with a normal impression settles the alert", () => {
    expect(settleFinding(alert, earlier, [later])).toMatchObject({
      state: "settled",
      reportId: later.reportId,
      date: "2025-03-24",
      earlier: "A 4.2 x 3.1 cm complex mass in the right adnexa.",
      later: "No adnexal mass is seen.",
    });
  });

  test("a linked later study that prints the same alert confirms it", () => {
    const repeat = laterWith({}, "A 4.0 x 3.0 cm mass in the right adnexa persists.");
    expect(settleFinding(alert, earlier, [repeat])?.state).toBe("confirmed");
  });

  test("a linked later study with a different alert leaves the alert open", () => {
    const other = laterWith({}, "A 5 mm calculus in the right kidney.");
    expect(settleFinding(alert, earlier, [other])).toBeUndefined();
  });

  test("a later study that is not linked leaves the alert open", () => {
    expect(settleFinding(alert, earlier, [laterWith({ linked: false })])).toBeUndefined();
  });

  test("the latest linked study decides", () => {
    const third = laterWith(
      { reportId: "third", date: "2025-05-01" },
      "A 4.1 cm mass in the right adnexa.",
    );
    expect(settleFinding(alert, earlier, [later, third])).toMatchObject({
      state: "confirmed",
      reportId: "third",
    });
  });

  test("a repeat of a marker within 30 days drives its status, linked or not", () => {
    const risk = { kind: "risk" as const, citedKeys: ["tsh"], citedStudyIds: [] };
    const soon = laterWith({ date: "2025-03-05", linked: false });
    expect(settleFinding(risk, earlier, [soon])).toMatchObject({
      state: "settled",
      earlier: "6.1 µIU/mL with risk status",
      later: "2.1 µIU/mL with optimal status",
      severity: "optimal",
    });
    expect(settleFinding(risk, earlier, [later])).toBeUndefined();
  });

  test("in a weekly history a risk value still settles, an optimal value does not", () => {
    const soon = laterWith({ date: "2025-03-05", linked: false });
    const risk = { kind: "risk" as const, citedKeys: ["tsh"], citedStudyIds: [] };
    expect(settleFinding(risk, earlier, [soon], 7)?.state).toBe("settled");
    const optimal = {
      ...earlier,
      markers: earlier.markers.map((row) =>
        row.markerKey === "tsh" ? { ...row, value: 2.4, status: "optimal" as const } : row,
      ),
    };
    const change = { kind: "change" as const, citedKeys: ["tsh"], citedStudyIds: [] };
    expect(settleFinding(change, optimal, [soon], 7)).toBeUndefined();
    expect(settleFinding(change, optimal, [soon], 60)?.state).toBe("settled");
  });
});

describe("buildFindings with a later report", () => {
  test("the settled alert leaves the top findings, the headline and the questions", () => {
    const open = buildFindings(earlier, [], []);
    expect(open.findings[0]).toMatchObject({ kind: "study_alert", rank: 0 });
    expect(open.headline?.startsWith(alertHeadlineStart)).toBe(true);

    const { findings, headline, doctorQuestions } = buildFindings(earlier, [], [], [later]);
    const settled = findings.find(({ kind }) => kind === "study_alert");
    expect(findings.at(-1)).toBe(settled);
    expect(settled).toMatchObject({
      settlement: { state: "settled" },
      fallback: "Settled by the report of 24 Mar 2025.",
    });
    expect(settled?.askDoctor).toBeUndefined();
    expect(settled?.note).toBeUndefined();
    expect(settled?.facts).toContain(
      "Write that the report of 24 Mar 2025 settles it. Do not write about it as a current result.",
    );
    expect(headline).toBeUndefined();
    expect(doctorQuestions.some((question) => question.includes("adnexa"))).toBe(false);
  });

  test("a confirmed alert stays first with the later line in its facts", () => {
    const repeat = laterWith({}, "A 4.0 x 3.0 cm mass in the right adnexa persists.");
    const { findings, headline } = buildFindings(earlier, [], [], [repeat]);
    expect(findings[0]).toMatchObject({ kind: "study_alert", settlement: { state: "confirmed" } });
    expect(findings[0]?.facts.at(-1)).toBe(
      "The report of 24 Mar 2025 repeats it. It reads: A 4.0 x 3.0 cm mass in the right adnexa persists.",
    );
    expect(headline).toBeDefined();
  });
});
