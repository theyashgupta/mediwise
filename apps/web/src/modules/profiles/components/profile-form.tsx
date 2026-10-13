import { zodResolver } from "@hookform/resolvers/zod";
import {
  ancestries,
  isMinor,
  type ProfileInput,
  profileInputSchema,
  relations,
  sexes,
} from "@mediwise/shared";
import { type Resolver, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { getT, useT } from "@/common/hooks/use-locale";
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
import { messages } from "@/config/messages";

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

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

const englishErrors = messages.en.profiles.form.errors;
const errorKeys = Object.keys(englishErrors) as (keyof typeof englishErrors)[];
const validate = zodResolver(profileInputSchema);

/**
 * Validates with the shared profile schema and shows its messages in the active locale.
 *
 * @remarks
 * The shared schema writes English messages, so each one is matched to the English namespace text and swapped for the active locale's. An unmatched message stays as it is.
 */
const resolver: Resolver<ProfileFormValues, unknown, ProfileInput> = async (
  values,
  context,
  options,
) => {
  const result = await validate(values, context, options);
  const local = getT().profiles.form.errors;
  for (const error of Object.values(result.errors)) {
    const key = errorKeys.find((name) => englishErrors[name] === error?.message);
    if (error && key) error.message = local[key];
  }
  return result;
};

function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <FormItem className="flex items-start gap-3">
      <FormControl>
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-primary"
          checked={checked ?? false}
          onChange={(event) => onChange(event.target.checked)}
        />
      </FormControl>
      <div className="grid gap-1">
        <FormLabel className="font-normal leading-snug">{label}</FormLabel>
        <FormMessage />
      </div>
    </FormItem>
  );
}

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
  const t = useT();
  const text = t.profiles.form;
  const form = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver,
    defaultValues: {
      name: "",
      dateOfBirth: "",
      ...defaultValues,
      relation: isSelf ? "self" : defaultValues?.relation,
    },
  });
  const dateOfBirth = useWatch({ control: form.control, name: "dateOfBirth" });
  const showGuardian = !isSelf && isoDate.test(dateOfBirth) && isMinor(dateOfBirth);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {!hideName && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{text.name}</FormLabel>
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
                <FormLabel>{text.relation}</FormLabel>
                <SelectField
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={text.relationPlaceholder}
                  options={memberRelations.map((value) => ({
                    value,
                    label: t.profiles.relation[value],
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
                {text.dateOfBirth}
                {approximateBirth && <Badge variant="secondary">{t.profiles.approximate}</Badge>}
              </FormLabel>
              <FormControl>
                <Input type="date" min="1900-01-01" {...field} />
              </FormControl>
              {approximateBirth && (
                <FormDescription>{t.profiles.approximateBirthNote}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{text.sex}</FormLabel>
              <SelectField
                value={field.value}
                onChange={field.onChange}
                placeholder={text.sexPlaceholder}
                options={sexes.map((value) => ({ value, label: t.profiles.sex[value] }))}
              />
              <FormDescription>{text.sexHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ancestry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{text.ancestry}</FormLabel>
              <SelectField
                value={field.value}
                onChange={field.onChange}
                placeholder={text.ancestryPlaceholder}
                options={ancestries.map((value) => ({ value, label: t.profiles.ancestry[value] }))}
              />
              <FormDescription>{text.ancestryHint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isSelf && (
          <FormField
            control={form.control}
            name="permissionConfirmed"
            render={({ field }) => (
              <CheckboxField
                checked={field.value}
                onChange={field.onChange}
                label={text.permission}
              />
            )}
          />
        )}
        {showGuardian && (
          <FormField
            control={form.control}
            name="guardianConfirmed"
            render={({ field }) => (
              <CheckboxField
                checked={field.value}
                onChange={field.onChange}
                label={text.guardian}
              />
            )}
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
          {submitting ? t.profiles.saving : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
