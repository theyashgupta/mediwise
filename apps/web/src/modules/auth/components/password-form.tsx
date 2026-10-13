import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type NewPassword, newPasswordSchema } from "../config/schemas";
import { FormError } from "./form-error";

type PasswordFormProps = {
  submitting: boolean;
  error?: string;
  fullWidth?: boolean;
  onSubmit: (values: NewPassword) => void;
};

export function PasswordForm({ submitting, error, fullWidth, onSubmit }: PasswordFormProps) {
  const t = useT();
  const form = useForm<NewPassword>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.auth.fields.newPassword}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.auth.fields.confirmPassword}</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={error} />
        <Button
          type="submit"
          disabled={submitting}
          className={cn(fullWidth ? "w-full" : "w-full sm:w-auto")}
        >
          {submitting ? t.auth.buttons.saving : t.auth.buttons.savePassword}
        </Button>
      </form>
    </Form>
  );
}
