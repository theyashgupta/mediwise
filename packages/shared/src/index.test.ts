import { expect, test } from "vitest";
import { healthResponseSchema, profileInputSchema, reportFilesSchema } from "./index";

test("healthResponseSchema accepts ok with an ISO time and rejects anything else", () => {
  expect(
    healthResponseSchema.safeParse({ status: "ok", time: new Date().toISOString() }).success,
  ).toBe(true);
  expect(
    healthResponseSchema.safeParse({ status: "down", time: new Date().toISOString() }).success,
  ).toBe(false);
  expect(healthResponseSchema.safeParse({ status: "ok", time: "yesterday" }).success).toBe(false);
});

const validProfile = {
  name: "Asha",
  relation: "parent",
  dateOfBirth: "1960-02-29",
  sex: "female",
  ancestry: "south_asian",
};

test("profileInputSchema accepts a complete profile and trims the name", () => {
  expect(profileInputSchema.parse({ ...validProfile, name: "  Asha " }).name).toBe("Asha");
});

test("profileInputSchema rejects an unknown relation, a non ISO date and a future date", () => {
  expect(profileInputSchema.safeParse({ ...validProfile, relation: "cousin" }).success).toBe(false);
  expect(profileInputSchema.safeParse({ ...validProfile, dateOfBirth: "29/02/1960" }).success).toBe(
    false,
  );
  expect(profileInputSchema.safeParse({ ...validProfile, dateOfBirth: "2999-01-01" }).success).toBe(
    false,
  );
});

const mb = 1024 * 1024;
const pdf = { name: "report.pdf", mime: "application/pdf", size: 3 * mb };
const photo = { name: "page.jpg", mime: "image/jpeg", size: 2 * mb };
const messages = (files: object[]) =>
  reportFilesSchema.safeParse(files).error?.issues.map((issue) => issue.message) ?? [];

test("reportFilesSchema accepts up to 20 PDFs and photos in any mix", () => {
  expect(messages([pdf])).toEqual([]);
  expect(messages([...Array(10).fill(pdf), ...Array(10).fill(photo)])).toEqual([]);
  expect(
    messages([
      pdf,
      { ...photo, mime: "image/heic" },
      { ...photo, mime: "image/webp" },
    ]),
  ).toEqual([]);
});

test("reportFilesSchema refuses 21 files, a 30 MB file, 101 MB in total and a wrong type", () => {
  expect(messages(Array(21).fill(photo))).toEqual(["Upload up to 20 files"]);
  expect(messages([{ ...photo, size: 30 * mb }])).toEqual(["page.jpg is larger than 25 MB"]);
  expect(messages([...Array(4).fill({ ...pdf, size: 25 * mb }), { ...photo, size: mb }])).toEqual([
    "These files are larger than 100 MB together",
  ]);
  expect(messages([{ ...photo, mime: "image/gif" }])).toEqual([
    "Upload a PDF or photos in JPEG, PNG, HEIC or WebP",
  ]);
  expect(messages([])).toEqual(["Add a PDF or photos of your report"]);
});
