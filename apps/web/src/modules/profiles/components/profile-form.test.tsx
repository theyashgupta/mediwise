import { profileInputSchema } from "@mediwise/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import { ProfileForm } from "./profile-form";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-13T06:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function render(dateOfBirth: string, isSelf = false) {
  return renderToStaticMarkup(
    <ProfileForm
      defaultValues={{ name: "Meera", relation: "child", dateOfBirth }}
      isSelf={isSelf}
      submitLabel="Add profile"
      submitting={false}
      onSubmit={() => {}}
    />,
  );
}

test("a family profile form shows the permission checkbox, the self form does not", () => {
  expect(render("1990-01-01")).toMatch(/type="checkbox".*this person’s permission/);
  expect(render("1990-01-01", true)).not.toContain("permission");
});

test("the guardian line shows only while the date of birth gives an age under 18", () => {
  expect(render("2015-05-01")).toContain("parent or guardian");
  expect(render("2008-10-14")).toContain("parent or guardian");
  expect(render("2008-10-13")).not.toContain("parent or guardian");
  expect(render("")).not.toContain("parent or guardian");
  expect(render("2015-05-01", true)).not.toContain("parent or guardian");
});

test("every message of the shared profile schema has a key in the profiles namespace", () => {
  const valid = {
    name: "Meera",
    relation: "child",
    dateOfBirth: "2015-05-01",
    sex: "female",
    ancestry: "south_asian",
  };
  const inputs = [
    { name: "", dateOfBirth: "" },
    { ...valid, name: "a".repeat(81), dateOfBirth: "1899-12-31" },
    { ...valid, dateOfBirth: "2999-01-01" },
    valid,
  ];
  const found = new Set(
    inputs.flatMap(
      (input) => profileInputSchema.safeParse(input).error?.issues.map((i) => i.message) ?? [],
    ),
  );
  expect([...found].sort()).toEqual(Object.values(messages.en.profiles.form.errors).sort());
});
