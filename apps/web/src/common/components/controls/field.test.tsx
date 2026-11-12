/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Field } from "./field";
import { Input } from "./input";
import { Select, SelectItem } from "./select";

afterEach(cleanup);

test("an error marks the control invalid and links the hint and the error to it", () => {
  render(
    <Field label="Name" hint="The name shown across MediWise." error="Type a name.">
      <Input />
    </Field>,
  );
  const input = screen.getByLabelText("Name");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  const described = (input.getAttribute("aria-describedby") ?? "")
    .split(" ")
    .map((id) => document.getElementById(id)?.textContent);
  expect(described).toEqual(["The name shown across MediWise.", "Type a name."]);
  expect(screen.getByRole("alert").textContent).toBe("Type a name.");
});

test("a field with no error leaves the control valid and shows no alert", () => {
  render(
    <Field label="Name" hint="The name shown across MediWise.">
      <Input />
    </Field>,
  );
  const input = screen.getByLabelText("Name");
  expect(input.getAttribute("aria-invalid")).toBeNull();
  expect(input.getAttribute("aria-describedby")).not.toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("the field keeps the id and the description the control already has", () => {
  render(
    <>
      <p id="outside">Shown above the form.</p>
      <Field label="Email" error="Type an email address.">
        <Input id="email" aria-describedby="outside" />
      </Field>
    </>,
  );
  const input = screen.getByLabelText("Email");
  expect(input.id).toBe("email");
  expect(input.getAttribute("aria-describedby")?.split(" ")[0]).toBe("outside");
});

test("a select inside a field gets the label, the error link and the invalid mark on its trigger", () => {
  render(
    <Field label="Sex" error="Select a sex.">
      <Select placeholder="Select">
        <SelectItem value="female">Female</SelectItem>
      </Select>
    </Field>,
  );
  const trigger = screen.getByRole("combobox", { name: "Sex" });
  expect(trigger.getAttribute("aria-invalid")).toBe("true");
  const described = document.getElementById(trigger.getAttribute("aria-describedby") ?? "");
  expect(described?.textContent).toBe("Select a sex.");
});
