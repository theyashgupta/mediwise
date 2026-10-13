import { expect, test } from "vitest";
import { installOffer, isIos } from "./install-offer";

const now = Date.parse("2026-10-14T10:00:00Z");
const day = 86_400_000;
const android = {
  visits: 2,
  now,
  dismissedAt: undefined,
  hintSeen: false,
  canInstall: true,
  ios: false,
  standalone: false,
};
const iphone = { ...android, canInstall: false, ios: true };

test("the first visit shows no install offer", () => {
  expect(installOffer({ ...android, visits: 1 })).toBeUndefined();
  expect(installOffer({ ...iphone, visits: 1 })).toBeUndefined();
});

test("from the second visit Android shows the banner while the browser offers an install", () => {
  expect(installOffer(android)).toBe("banner");
  expect(installOffer({ ...android, visits: 9 })).toBe("banner");
  expect(installOffer({ ...android, canInstall: false })).toBeUndefined();
});

test("a dismissed banner stays hidden for 30 days, then shows again", () => {
  expect(installOffer({ ...android, dismissedAt: now - 29 * day })).toBeUndefined();
  expect(installOffer({ ...android, dismissedAt: now - 30 * day })).toBe("banner");
});

test("iOS shows the hint sheet once", () => {
  expect(installOffer(iphone)).toBe("ios-hint");
  expect(installOffer({ ...iphone, hintSeen: true })).toBeUndefined();
});

test("the installed app shows no install offer", () => {
  expect(installOffer({ ...android, standalone: true })).toBeUndefined();
  expect(installOffer({ ...iphone, standalone: true })).toBeUndefined();
});

test("an iPhone and an iPad with a Mac user agent count as iOS, a Mac and Android do not", () => {
  expect(isIos("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5)).toBe(true);
  expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5)).toBe(true);
  expect(isIos("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0)).toBe(false);
  expect(isIos("Mozilla/5.0 (Linux; Android 15; Pixel 9)", 5)).toBe(false);
});
