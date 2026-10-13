import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { takeSharedFiles } from "../config/shared-files";

/**
 * Adds the files another app shared to MediWise, once, and removes `shared` from the URL.
 *
 * @remarks
 * The ref stops the StrictMode second effect from reading the cache again before the first read deletes it.
 * Returns how many files the share added.
 */
export function useSharedFiles(add: (files: File[]) => void) {
  const { shared } = useSearch({ from: "/_app/reports/upload" });
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const taken = useRef(false);

  useEffect(() => {
    if (!shared || taken.current) return;
    taken.current = true;
    void takeSharedFiles().then((files) => {
      add(files);
      setCount(files.length);
      void navigate({ to: "/reports/upload", search: {}, replace: true });
    });
  }, [shared, add, navigate]);

  return count;
}
