import { z } from "zod";

const email = z.email("Enter a valid email.");
const newPassword = z.string().min(8, "Use at least 8 characters.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});
export const signUpSchema = z.object({ email, password: newPassword });
export const emailSchema = z.object({ email });
export const loginSearchSchema = z.object({
  next: z.string().optional(),
  error: z.string().optional(),
});

/** A new password typed twice. */
export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    message: "The two passwords are not the same.",
    path: ["confirm"],
  });

export type Credentials = z.infer<typeof signInSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type NewPassword = z.infer<typeof newPasswordSchema>;
