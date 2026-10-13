import { expect, test } from "vitest";
import { authErrorMessage } from "./messages";

test("a known Supabase error code maps to app copy", () => {
  expect(authErrorMessage({ code: "invalid_credentials" })).toBe(
    "The email or the password is not correct.",
  );
});

test("an unknown or missing code falls back to a generic sentence", () => {
  expect(authErrorMessage({ code: "something_new" })).toBe(
    "We could not complete this. Try again.",
  );
  expect(authErrorMessage({})).toBe("We could not complete this. Try again.");
});

test("the Google errors map to readable app copy", () => {
  expect(authErrorMessage({ code: "access_denied" })).toBe(
    "You stopped the Google sign-in. You can try again or use your email.",
  );
  expect(authErrorMessage({ code: "provider_disabled" })).toBe(
    "Google sign-in is not available yet. Use your email and password.",
  );
});
