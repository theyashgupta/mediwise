import { expect, test } from "vitest";
import { newPasswordSchema, signInSchema, signUpSchema } from "./schemas";

test("sign-in accepts any non-empty password", () => {
  expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
});

const consents = { terms: true, health_data: true };

test("sign-up rejects a password under 8 characters", () => {
  expect(
    signUpSchema.safeParse({ email: "a@b.co", password: "1234567", ...consents }).success,
  ).toBe(false);
  expect(
    signUpSchema.safeParse({ email: "a@b.co", password: "12345678", ...consents }).success,
  ).toBe(true);
});

test("sign-up needs both consent boxes ticked, each with its own message", () => {
  const result = signUpSchema.safeParse({
    email: "a@b.co",
    password: "12345678",
    terms: false,
    health_data: false,
  });
  expect(result.error?.issues.map(({ path, message }) => [path[0], message])).toEqual([
    ["terms", "Tick this box to continue."],
    ["health_data", "Tick this box to continue."],
  ]);
  expect(
    signUpSchema.safeParse({ email: "a@b.co", password: "12345678", terms: true }).success,
  ).toBe(false);
});

test("a bad email fails with a readable message", () => {
  const result = signInSchema.safeParse({ email: "nope", password: "x" });
  expect(result.error?.issues[0]?.message).toBe("Enter a valid email.");
});

test("a new password must match its confirmation", () => {
  const result = newPasswordSchema.safeParse({ password: "12345678", confirm: "12345679" });
  expect(result.error?.issues[0]).toMatchObject({
    path: ["confirm"],
    message: "The two passwords are not the same.",
  });
  expect(newPasswordSchema.safeParse({ password: "12345678", confirm: "12345678" }).success).toBe(
    true,
  );
});
