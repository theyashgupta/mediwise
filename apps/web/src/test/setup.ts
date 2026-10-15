/**
 * Pins the browser language to en-GB, so date and number output does not depend on the machine's ICU default.
 *
 * @remarks
 * An own property on the real navigator, so jsdom keeps its user agent and `vi.unstubAllGlobals` returns to en-GB.
 */
Object.defineProperty(globalThis.navigator, "language", { value: "en-GB", configurable: true });
