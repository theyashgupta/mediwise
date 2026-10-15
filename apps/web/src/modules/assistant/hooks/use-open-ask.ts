import { createContext, useContext } from "react";

export type AskPrefill = { q?: string; report?: string };

export const OpenAskContext = createContext<(prefill?: AskPrefill) => void>(() => undefined);

/** Returns the function that opens the Ask chat widget, with an optional question and report. */
export function useOpenAsk() {
  return useContext(OpenAskContext);
}
