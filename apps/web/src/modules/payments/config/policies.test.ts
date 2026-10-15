import { expect, test } from "vitest";
import { contact, policies } from "./policies";

const sentences = Object.values(policies).flatMap((policy) =>
  policy.sections.flatMap((section) => section.body.flatMap((line) => line.split(/(?<=\.) /))),
);

test("every policy sentence has 20 words or fewer and no semicolon", () => {
  for (const sentence of sentences) {
    expect(sentence.split(/\s+/).length, sentence).toBeLessThanOrEqual(20);
    expect(sentence, sentence).not.toContain(";");
  }
});

test("the refund policy gives 7 days to refund a credit that was never used", () => {
  const refunds = policies.refunds.sections.flatMap((section) => section.body).join(" ");
  expect(refunds).toContain("did not use");
  expect(refunds).toContain("within 7 days");
});

test("the privacy policy explains family consent, child profiles and deletion records", () => {
  const headings = policies.privacy.sections.map((section) => section.heading);
  expect(headings).toEqual(
    expect.arrayContaining(["Family members", "Children", "Deletion records"]),
  );
  expect(JSON.stringify(policies).toLowerCase()).not.toContain("compliant");
});

test("every policy page shows the company, proprietor, email, phone, address and GSTIN", () => {
  for (const policy of Object.values(policies)) {
    const text = policy.sections.flatMap((section) => section.body).join(" ");
    expect(text).toContain("MediWise is a brand of Codegenix.");
    for (const value of Object.values(contact)) expect(text, policy.title).toContain(value);
    expect(text, policy.title).not.toMatch(/\[[a-z ]+\]/);
  }
});
