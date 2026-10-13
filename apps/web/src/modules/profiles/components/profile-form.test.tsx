import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
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
