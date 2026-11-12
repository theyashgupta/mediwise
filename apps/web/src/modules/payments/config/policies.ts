import { sanitizeHtml } from "@/common/utils/sanitize-html";
import snapshot from "../../../../content/legal.en.json";

export { contact } from "@mediwise/shared";

export const washingtonSectionId = "washington";

export type PolicyPage = "terms" | "privacy" | "refunds" | "contact";

type Policy = { title: string; html: string; updatedAt: string };

export const policyLinks = [
  { page: "terms", to: "/terms" },
  { page: "privacy", to: "/privacy" },
  { page: "refunds", to: "/refunds" },
  { page: "contact", to: "/contact" },
] as const;

export const policies = Object.fromEntries(
  policyLinks.map(({ page }) => {
    const { title, html, updatedAt } = snapshot.pages[page];
    return [page, { title, html: sanitizeHtml(html), updatedAt }];
  }),
) as Record<PolicyPage, Policy>;
