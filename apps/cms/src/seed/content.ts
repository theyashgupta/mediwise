import { randomBytes } from "node:crypto";
import type { TypedLocale } from "payload";
import { messages } from "../../../landing/src/config/messages";
import { policies } from "../../../web/src/modules/payments/config/policies";

type LexicalNode = { type: string; version: number; [key: string]: unknown };

const securityPolicyUrl = "https://github.com/theyashgupta/mediwise/blob/main/SECURITY.md";

const element = { direction: "ltr", format: "", indent: 0, version: 1 } as const;

const text = (value: string): LexicalNode => ({
  type: "text",
  text: value,
  detail: 0,
  format: 0,
  mode: "normal",
  style: "",
  version: 1,
});

const paragraph = (children: LexicalNode[]): LexicalNode => ({
  ...element,
  type: "paragraph",
  textFormat: 0,
  textStyle: "",
  children,
});

const heading = (value: string, anchorId?: string): LexicalNode => ({
  ...element,
  type: "heading",
  tag: "h2",
  children: [
    ...(anchorId
      ? [
          {
            type: "inlineBlock",
            version: 1,
            fields: {
              id: randomBytes(12).toString("hex"),
              blockType: "anchor",
              blockName: "",
              anchorId,
            },
          },
        ]
      : []),
    text(value),
  ],
});

const link = (value: string, url: string): LexicalNode => ({
  ...element,
  type: "link",
  version: 3,
  fields: { url, newTab: false, linkType: "custom" },
  children: [text(value)],
});

const richText = (children: LexicalNode[]) => ({ root: { ...element, type: "root", children } });

const lines = (values: string[]) => values.map((value) => paragraph([text(value)]));

type SeedPage = {
  slug: string;
  title: string;
  description?: string;
  body: ReturnType<typeof richText>;
};
type SeedFaqItem = {
  key: string;
  order: number;
  question: string;
  answer: ReturnType<typeof richText>;
};

/**
 * Builds the five pages for one locale from the web policies and the landing security messages.
 *
 * @remarks
 * The policies exist in English only, so Hindi gets the security page alone and the rest falls back to English.
 */
export function seedPages(locale: TypedLocale): SeedPage[] {
  const security = messages[locale].security;
  const securityPage: SeedPage = {
    slug: "security",
    title: security.title,
    description: security.description,
    body: richText([
      ...lines([security.intro]),
      ...Object.values(security.items).flatMap((item) => [
        heading(item.title),
        ...lines([item.body]),
      ]),
      heading(security.report.title),
      ...lines([security.report.body]),
      paragraph([link(security.report.link, securityPolicyUrl)]),
    ]),
  };
  if (locale === "hi") return [securityPage];
  const legal = Object.entries(policies).map(([slug, policy]) => ({
    slug,
    title: policy.title,
    body: richText(
      policy.sections.flatMap((section) => [
        heading(section.heading, section.id),
        ...lines(section.body),
      ]),
    ),
  }));
  return [...legal, securityPage];
}

const faqKeys = ["upload", "labs", "accuracy", "diagnosis", "data", "refund", "family"] as const;

const tokens: Partial<Record<(typeof faqKeys)[number], string[]>> = {
  upload: ["{maxFiles}", "{fileMb}", "{totalMb}"],
  labs: ["{markers}"],
  diagnosis: ["{disclaimer}"],
  family: ["{maxProfiles}"],
};

/**
 * Builds the FAQ items for one locale in landing order, with tokens in place of the numbers from the code.
 */
export function seedFaq(locale: TypedLocale): SeedFaqItem[] {
  return faqKeys.map((key, index) => {
    const item = messages[locale].faq[key];
    const answer =
      typeof item.answer === "function"
        ? (item.answer as (...args: string[]) => string[])(...(tokens[key] ?? []))
        : item.answer;
    return { key, order: index + 1, question: item.question, answer: richText(lines(answer)) };
  });
}
