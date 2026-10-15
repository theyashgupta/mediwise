import { useRef, useState } from "react";

/**
 * Wraps an async submit so a second call is dropped while the first one runs.
 *
 * @remarks
 * The guard is a ref set before the first await, because a pending flag from the last render stays false for every click and Enter inside one frame.
 * A rejection is dropped here, since the caller's mutation state already holds the error.
 */
export function useInFlight<Args extends unknown[]>(action: (...args: Args) => Promise<unknown>) {
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const run = async (...args: Args) => {
    if (running.current) return;
    running.current = true;
    setPending(true);
    try {
      await action(...args).catch(() => undefined);
    } finally {
      running.current = false;
      setPending(false);
    }
  };
  return { run, pending };
}
