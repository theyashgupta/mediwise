import { zodResolver } from "@hookform/resolvers/zod";
import {
  ancestries,
  type ProfileInput,
  profileInputSchema,
  relations,
  sexes,
} from "@mediwise/shared";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ancestryLabels, approximateBirthNote, relationLabels, sexLabels } from "../config/labels";

type ProfileFormValues = z.input<typeof profileInputSchema>;

type ProfileFormProps = {
  defaultValues?: Partial<ProfileFormValues>;
  isSelf: boolean;
  approximateBirth?: boolean;
  hideName?: boolean;
  submitLabel: string;
  submitting: boolean;
  error?: string;
  onSubmit: (values: ProfileInput) => void;
};

type Option = { value: string; label: string };

const memberRelations = relations.filter((relation) => relation !== "self");

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Option[];
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ProfileForm({
  defaultValues,
  isSelf,
  approximateBirth = false,
  hideName = false,
  submitLabel,
  submitting,
  error,
  onSubmit,
}: ProfileFormProps) {
  const form = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver: zodResolver(profileInputSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      ...defaultValues,
      relation: isSelf ? "self" : defaultValues?.relation,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {!hideName && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete={isSelf ? "name" : "off"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {!isSelf && (
          <FormField
            control={form.control}
            name="relation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relation to you</FormLabel>
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Choose a relation"
                  options={memberRelations.map((value) => ({
                    value,
                    label: relationLabels[value],
                  }))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Date of birth
                {approximateBirth && <Badge variant="secondary">Approximate</Badge>}
              </FormLabel>
              <FormControl>
                <Input type="date" min="1900-01-01" {...field} />
              </FormControl>
              {approximateBirth && <FormDescription>{approximateBirthNote}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sex</FormLabel>
              <SelectField
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose a sex"
                options={sexes.map((value) => ({ value, label: sexLabels[value] }))}
              />
              <FormDescription>Many lab ranges differ by sex.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ancestry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ancestry</FormLabel>
              <SelectField
                value={field.value}
                onChange={field.onChange}
                placeholder="Choose an ancestry"
                options={ancestries.map((value) => ({ value, label: ancestryLabels[value] }))}
              />
              <FormDescription>
                MediWise calibrates some ranges by ancestry, for example blood sugar and
                cholesterol.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? "Saving" : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
