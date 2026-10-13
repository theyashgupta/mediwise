import { expect, test } from "vitest";
import { newPasswordSchema, signInSchema, signUpSchema } from "./schemas";

test("sign-in accepts any non-empty password", () => {
  expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
});

test("sign-up rejects a password under 8 characters", () => {
  expect(signUpSchema.safeParse({ email: "a@b.co", password: "1234567" }).success).toBe(false);
  expect(signUpSchema.safeParse({ email: "a@b.co", password: "12345678" }).success).toBe(true);
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
