import { expect, test } from "vitest";
import { contact, policies, washingtonSectionId } from "./policies";

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

const privacy = policies.privacy.sections;
const privacyText = privacy.flatMap((section) => section.body).join(" ");
const allText = JSON.stringify(policies);

test("the privacy policy sections come in the agreed order", () => {
  expect(privacy.map((section) => section.heading)).toEqual([
    "What we collect",
    "Why we use it",
    "Who receives your data",
    "Where we store it",
    "How long we keep it",
    "Your rights",
    "Consent and how to withdraw it",
    "Children",
    "Cookies",
    "Security",
    "Breaches",
    "International users: EU and UK",
    "Washington state consumer health data",
    "Changes to this policy",
    "Contact and grievance officer",
  ]);
  expect(privacy.find((section) => section.id === washingtonSectionId)?.heading).toBe(
    "Washington state consumer health data",
  );
});

test("the privacy policy names each receiver with its country", () => {
  for (const receiver of [
    "Supabase (India)",
    "Render (Singapore)",
    "Anthropic (United States)",
    "Cashfree Payments (India)",
    "Resend (United States)",
    "Cloudflare (United States)",
  ]) {
    expect(privacyText).toContain(receiver);
  }
  expect(privacyText).toContain("Anthropic does not use this content to train its models.");
  expect(privacyText).toContain("Mumbai, India");
});

test("the privacy policy states retention, rights, breach notice and the age rule", () => {
  for (const fact of [
    "until you delete them or you delete your account",
    "tax law requires them",
    "older than 1 hour",
    "as a JSON file",
    "within 30 days",
    "within 72 hours",
    "18 or older",
    "no analytics, no advertising trackers and no third-party cookies",
    "standard contractual clauses",
    "data protection authority of your country",
    "We do not sell consumer health data.",
    "The grievance officer is Yash Anil Gupta.",
  ]) {
    expect(privacyText).toContain(fact);
  }
});

test("the terms say MediWise is not a medical device and keep the age and price lines", () => {
  const terms = policies.terms.sections.flatMap((section) => section.body).join(" ");
  expect(terms).toContain("MediWise is not a medical device.");
  expect(terms).toContain("It does not diagnose, treat or monitor a disease.");
  expect(terms).toContain("You must be 18 or older to make an account.");
  expect(terms).toContain("Prices are in Indian rupees.");
});

test("no policy claims a certification or compliance, or uses an em dash", () => {
  expect(allText).not.toMatch(/SOC 2|HIPAA|compliant|certified/i);
  expect(allText).not.toContain("\u2014");
  expect(allText).not.toMatch(/Stored in India\./);
});

test("every policy page shows the company, proprietor, email and phone, and no address or GSTIN", () => {
  for (const policy of Object.values(policies)) {
    const text = policy.sections.flatMap((section) => section.body).join(" ");
    expect(text).toContain("MediWise is a brand of Codegenix.");
    for (const value of Object.values(contact)) expect(text, policy.title).toContain(value);
    expect(text, policy.title).not.toMatch(/\[[a-z ]+\]/);
    expect(text, policy.title).not.toMatch(/Address:|GSTIN/);
  }
});
