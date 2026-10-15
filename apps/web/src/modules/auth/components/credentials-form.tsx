import { zodResolver } from "@hookform/resolvers/zod";
import { requiredConsentKinds } from "@mediwise/shared";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckboxField } from "@/common/components/checkbox-field";
import { Input } from "@/components/ui/input";
import { ConsentLabel } from "@/modules/me";
import { type SignUpValues, signInSchema, signUpSchema } from "../config/schemas";
import { FormError } from "./form-error";

type CredentialsFormProps = {
  mode: "sign-in" | "sign-up";
  submitting: boolean;
  error?: string;
  onSubmit: (values: SignUpValues) => void;
};

export function CredentialsForm({ mode, submitting, error, onSubmit }: CredentialsFormProps) {
  const t = useT();
  const signIn = mode === "sign-in";
  const form = useForm<SignUpValues>({
    resolver: zodResolver<SignUpValues, unknown, SignUpValues>(
      signIn ? signInSchema : signUpSchema,
    ),
    defaultValues: signIn
      ? { email: "", password: "" }
      : { email: "", password: "", terms: false, health_data: false },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.auth.fields.email}</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" data-testid="auth-email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t.auth.fields.password}</FormLabel>
                {signIn && (
                  <Link
                    to="/forgot-password"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {t.auth.fields.forgotPassword}
                  </Link>
                )}
              </div>
              <FormControl>
                <Input
                  type="password"
                  autoComplete={signIn ? "current-password" : "new-password"}
                  data-testid="auth-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!signIn &&
          requiredConsentKinds.map((kind) => (
            <FormField
              key={kind}
              control={form.control}
              name={kind}
              render={({ field }) => (
                <CheckboxField
                  checked={field.value}
                  onChange={field.onChange}
                  label={<ConsentLabel kind={kind} />}
                  testId={`auth-consent-${kind}`}
                />
              )}
            />
          ))}
        <FormError message={error} />
        <Button type="submit" disabled={submitting} className="w-full" data-testid="auth-submit">
          {signIn
            ? submitting
              ? t.auth.buttons.signingIn
              : t.auth.buttons.signIn
            : submitting
              ? t.auth.buttons.creatingAccount
              : t.auth.buttons.createAccount}
        </Button>
      </form>
    </Form>
  );
}
