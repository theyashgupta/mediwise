import { z } from "zod";
import { getT } from "@/common/hooks/use-locale";

const email = z.email({ error: () => getT().auth.validation.email });
const newPassword = z.string().min(8, { error: () => getT().auth.validation.passwordMin });

export const signInSchema = z.object({
  email,
  password: z.string().min(1, { error: () => getT().auth.validation.passwordRequired }),
});
const consentBox = z.literal(true, { error: () => getT().me.consent.required });
export const signUpSchema = z.object({
  email,
  password: newPassword,
  terms: consentBox,
  health_data: consentBox,
});
export const emailSchema = z.object({ email });
export const loginSearchSchema = z.object({
  next: z.string().optional(),
  error: z.string().optional(),
});

/** A new password typed twice. */
export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((values) => values.password === values.confirm, {
    error: () => getT().auth.validation.passwordMismatch,
    path: ["confirm"],
  });

export type Credentials = z.infer<typeof signInSchema>;
export type SignUpValues = Credentials & { terms?: boolean; health_data?: boolean };
export type EmailInput = z.infer<typeof emailSchema>;
export type NewPassword = z.infer<typeof newPasswordSchema>;
