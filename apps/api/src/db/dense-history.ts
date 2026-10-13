import fixture from "@mediwise/engine/fixtures/dense-history.json" with { type: "json" };
import { derived, type EngineProfile, type EngineValue, runEngine } from "@mediwise/engine";
import { db } from "./client.js";
import { profiles, reportMarkers, reports } from "./schema.js";

const dayMs = 86_400_000;
const derivedNames = new Map(derived.map((entry) => [entry.key, entry.name]));

export const denseHistoryProfile = fixture.profile;

/** Shifts a plain date by whole days. */
function shift(date: string, days: number) {
  return new Date(Date.parse(date) + days * dayMs).toISOString().slice(0, 10);
}

/**
 * Turns the dense history fixture into done reports with assessed marker rows, the newest report on `lastDate`.
 *
 * @remarks
 * Pure: the engine scores each report as the job would, so seeded rows match a real read. The dates move so the
 * newest report lands on `lastDate`, which keeps the 90-day chart view and the 30-day retest rule testable on any day.
 */
export function denseHistoryReports(lastDate: string) {
  const offset = Math.round(
    (Date.parse(lastDate) - Date.parse(fixture.reports.at(-1)!.collectedAt)) / dayMs,
  );
  const profile = fixture.profile as EngineProfile;
  return fixture.reports.map(({ collectedAt, labName, values }, index) => {
    const date = shift(collectedAt, offset);
    const output = runEngine({ profile, values: values as EngineValue[] });
    const rows = [...output.markers, ...output.derived].map((result) => {
      const numeric = typeof result.value === "number";
      return {
        markerKey: result.markerKey,
        rawName: derivedNames.get(result.markerKey) ?? result.markerKey,
        value: numeric ? (result.value as number) : null,
        valueText: numeric ? null : String(result.value),
        unit: result.unit,
        labRangeLow: result.labRange?.low ?? null,
        labRangeHigh: result.labRange?.high ?? null,
        status: result.status === "unknown" ? null : result.status,
        calibratedLow: result.calibrated?.optimalLow ?? null,
        calibratedHigh: result.calibrated?.optimalHigh ?? null,
        derived: derivedNames.has(result.markerKey),
      };
    });
    return {
      labName,
      collectedAt: date,
      createdAt: new Date(Date.parse(`${date}T10:00:00Z`) + index * 60_000),
      score: Math.round(output.score.overall),
      tier: output.score.tier,
      coverage: Math.round(output.score.coverage.pct),
      verdict: output.verdict,
      markers: rows,
    };
  });
}

/** Inserts a dense history profile with its done reports for one owner, and returns the ids in report order. */
export async function insertDenseHistory(
  ownerUserId: string,
  seeded: ReturnType<typeof denseHistoryReports>,
) {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .insert(profiles)
      .values({
        ownerUserId,
        name: denseHistoryProfile.name,
        relation: "other",
        dateOfBirth: denseHistoryProfile.dateOfBirth,
        sex: "male",
        ancestry: "south_asian",
        permissionConfirmedAt: new Date(),
      })
      .returning({ id: profiles.id });
    const reportIds: string[] = [];
    for (const { markers, ...report } of seeded) {
      const [row] = await tx
        .insert(reports)
        .values({ ...report, profileId: profile!.id, status: "done", sourceKind: "pdf" })
        .returning({ id: reports.id });
      await tx
        .insert(reportMarkers)
        .values(markers.map((marker) => ({ ...marker, reportId: row!.id })));
      reportIds.push(row!.id);
    }
    return { profileId: profile!.id, reportIds };
  });
}
