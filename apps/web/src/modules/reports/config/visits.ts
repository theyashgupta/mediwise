type VisitReport = { id: string; status: string; collectedAt: string | null };

/**
 * Groups reports into visits: done reports with one collection date are one visit, every other report stands alone.
 *
 * @remarks
 * Visits keep the order of their first report, so a list sorted newest first stays newest first.
 */
export function groupVisits<T extends VisitReport>(reports: T[]) {
  const visits = new Map<string, T[]>();
  for (const report of reports) {
    const key =
      report.status === "done" && report.collectedAt ? `visit-${report.collectedAt}` : report.id;
    visits.set(key, [...(visits.get(key) ?? []), report]);
  }
  return [...visits].map(([key, items]) => ({ key, reports: items }));
}
