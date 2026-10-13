import { type ReactNode, useDeferredValue } from "react";

export function AfterFirstPaint({ children }: { children: ReactNode }) {
  const ready = useDeferredValue(true, false);
  return ready ? children : null;
}
