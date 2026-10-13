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
import { type EmailInput, emailSchema } from "../config/schemas";
import { FormError } from "./form-error";

type EmailFormProps = {
  submitting: boolean;
  error?: string;
  onSubmit: (values: EmailInput) => void;
};

export function EmailForm({ submitting, error, onSubmit }: EmailFormProps) {
  const t = useT();
  const form = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
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
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormError message={error} />
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? t.auth.buttons.sendingLink : t.auth.buttons.sendLink}
        </Button>
      </form>
    </Form>
  );
}
