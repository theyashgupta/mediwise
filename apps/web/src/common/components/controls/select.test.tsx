/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, expect, test } from "vitest";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectItem } from "./select";

afterEach(cleanup);

function SexForm({ error }: { error?: string }) {
  const form = useForm<{ sex: string }>({ defaultValues: { sex: "" } });
  if (error && !form.formState.errors.sex) form.setError("sex", { message: error });
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="sex"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sex</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange} placeholder="Select">
                <SelectItem value="female">Female</SelectItem>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

test("a select inside a form control is named by the form label and shows its placeholder", () => {
  render(<SexForm />);
  const trigger = screen.getByRole("combobox", { name: "Sex" });
  expect(trigger.textContent).toContain("Select");
  expect(trigger.getAttribute("aria-invalid")).toBe("false");
});

test("a form error marks the select trigger invalid and links the message to it", () => {
  render(<SexForm error="Select a sex." />);
  const trigger = screen.getByRole("combobox", { name: "Sex" });
  expect(trigger.getAttribute("aria-invalid")).toBe("true");
  const described = (trigger.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);
  expect(described).toContain("Select a sex.");
});
