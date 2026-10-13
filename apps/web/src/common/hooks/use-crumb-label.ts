import { useEffect, useSyncExternalStore } from "react";

const labels = new Map<string, string>();
const listeners = new Set<() => void>();
let snapshot: ReadonlyMap<string, string> = new Map();

function publish() {
  snapshot = new Map(labels);
  listeners.forEach((listener) => listener());
}

/**
 * Names a page in the app header breadcrumb, such as a report by its lab name.
 *
 * @remarks
 * Pages own their data, so a page sets the label of its path and the shell reads it.
 * The label stays after the page unmounts, so the parent crumb on a child page keeps it.
 */
export function useCrumbLabel(path: string, label: string | null | undefined) {
  useEffect(() => {
    if (!label || labels.get(path) === label) return;
    labels.set(path, label);
    publish();
  }, [path, label]);
}

/**
 * Returns every page label set with `useCrumbLabel`, keyed by path.
 */
export function useCrumbLabels() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot,
  );
}
