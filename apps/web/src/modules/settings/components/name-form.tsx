import { zodResolver } from "@hookform/resolvers/zod";
import { type UpdateMeInput, updateMeSchema } from "@mediwise/shared";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getT, useT } from "@/common/hooks/use-locale";
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
import { Label } from "@/components/ui/label";

/**
 * The shared name schema with its messages read from the active locale.
 *
 * @remarks
 * The shared schema carries English messages, and zod lets a schema message win over any error map.
 */
const nameSchema = updateMeSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, { error: () => getT().settings.nameForm.nameRequired })
    .max(80, { error: () => getT().settings.nameForm.nameTooLong }),
});

type NameFormProps = {
  email: string;
  name: string;
  submitting: boolean;
  error?: string;
  onSubmit: (values: UpdateMeInput) => void;
};

export function NameForm({ email, name, submitting, error, onSubmit }: NameFormProps) {
  const t = useT();
  const copy = t.settings.nameForm;
  const form = useForm<UpdateMeInput>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{copy.name}</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="account-email">{copy.email}</Label>
          <Input id="account-email" value={email} readOnly disabled />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? copy.saving : copy.save}
        </Button>
      </form>
    </Form>
  );
}
