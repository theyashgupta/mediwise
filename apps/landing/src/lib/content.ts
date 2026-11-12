import en from "../../content/en.json";
import hi from "../../content/hi.json";
import { messages, type Locale } from "../config/messages";
import { facts } from "./facts";

export const content: Record<Locale, typeof en> = { en, hi };

const allowedTags = new Set(["h2", "h3", "h4", "p", "ul", "ol", "li", "a", "strong", "em", "br"]);
const safeHref = /^(https?:\/\/|mailto:|\/|#)/i;

/**
 * Escapes plain text for use inside HTML.
 */
export function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Keeps the allowlisted tags of CMS HTML and drops every attribute except a safe link `href`.
 *
 * @remarks
 * A dropped tag keeps its inner text, and a `<` or `>` outside a tag is escaped. The `href` is checked before the
 * browser decodes it, so an encoded `javascript:` never starts with an allowed prefix.
 */
export function sanitizeHtml(html: string) {
  return html.replace(
    /<(\/?)([a-z][a-z0-9]*)\b([^>]*)>|[<>]/gi,
    (match, close: string | undefined, name: string | undefined, attributes: string) => {
      if (!name) return escapeHtml(match);
      const tag = name.toLowerCase();
      if (!allowedTags.has(tag)) return "";
      if (close) return `</${tag}>`;
      const href = /\shref\s*=\s*"([^"]*)"/i.exec(attributes)?.[1];
      return tag === "a" && href && safeHref.test(href) ? `<a href="${href}">` : `<${tag}>`;
    },
  );
}

/**
 * Returns the FAQ items of one locale with sanitized HTML and the tokens filled from the code.
 *
 * @remarks
 * An unknown token stays as written, so a typo in the CMS shows on the page instead of vanishing.
 */
export function faqItems(locale: Locale) {
  const values: Record<string, string> = {
    maxFiles: String(facts.maxFiles),
    fileMb: String(facts.maxFileMb),
    totalMb: String(facts.maxTotalMb),
    markers: String(facts.markers),
    maxProfiles: String(facts.maxProfiles),
    disclaimer: escapeHtml(messages[locale].site.disclaimer),
  };
  return content[locale].faq.map(({ key, question, html }) => ({
    key,
    question,
    html: sanitizeHtml(html).replace(/\{(\w+)\}/g, (token, name: string) => values[name] ?? token),
  }));
}
