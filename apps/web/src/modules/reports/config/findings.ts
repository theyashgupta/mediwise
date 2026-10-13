import type { Finding, ReportDetail } from "../types";
import { studyTitle } from "./studies";

export const maxFindingCards = 6;

/**
 * Names the markers and studies a finding cites, from the report that holds the finding.
 *
 * @remarks
 * A citation the report cannot name is left out, so a chip never shows a raw key or id.
 */
export function findingChips(
  finding: Pick<Finding, "citedKeys" | "citedStudyIds">,
  report: Pick<ReportDetail, "categories" | "derived" | "studies">,
) {
  const names = new Map(
    [...report.categories.flatMap((category) => category.markers), ...report.derived].map(
      (marker) => [marker.markerKey, marker.name],
    ),
  );
  const studies = new Map(report.studies.map((study) => [study.id, studyTitle(study)]));
  return {
    markers: finding.citedKeys.flatMap((key) => {
      const name = names.get(key);
      return name ? [{ key, name }] : [];
    }),
    studies: finding.citedStudyIds.flatMap((id) => {
      const title = studies.get(id);
      return title ? [{ id, title }] : [];
    }),
  };
}
