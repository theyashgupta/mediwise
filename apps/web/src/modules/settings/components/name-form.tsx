import { zodResolver } from "@hookform/resolvers/zod";
import { type UpdateMeInput, updateMeSchema } from "@mediwise/shared";
import { useForm } from "react-hook-form";
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

type NameFormProps = {
  email: string;
  name: string;
  submitting: boolean;
  error?: string;
  onSubmit: (values: UpdateMeInput) => void;
};

export function NameForm({ email, name, submitting, error, onSubmit }: NameFormProps) {
  const form = useForm<UpdateMeInput>({
    resolver: zodResolver(updateMeSchema),
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
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <Label htmlFor="account-email">Email</Label>
          <Input id="account-email" value={email} readOnly disabled />
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Saving" : "Save name"}
        </Button>
      </form>
    </Form>
  );
}
