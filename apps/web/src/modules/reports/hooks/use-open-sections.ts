import { useEffect, useState } from "react";

const storageKey = "reportSections";

/** Reads the stored open state of each report fold, or none when storage fails. */
function readStored(): Record<string, boolean> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    return stored && typeof stored === "object" ? (stored as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/**
 * Keeps the open state of each report fold and stores it on this device.
 *
 * @remarks
 * One key holds the state for every report, so a reader who opens Studies once finds it open on the next report.
 */
export function useOpenSections() {
  const [stored, setStored] = useState(readStored);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(stored));
      // eslint-disable-next-line no-empty
    } catch {}
  }, [stored]);
  return {
    isOpen: (id: string, fallback: boolean) => stored[id] ?? fallback,
    setOpen: (id: string, open: boolean) =>
      setStored((current) => (current[id] === open ? current : { ...current, [id]: open })),
  };
}
