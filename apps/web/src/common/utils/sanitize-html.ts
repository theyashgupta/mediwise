const allowedTags = new Set([
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "a",
  "strong",
  "em",
  "br",
  "span",
]);

const tagPattern = /<(\/?)([a-z][a-z0-9]*)\b([^<>]*)>|[<>]/gi;
const safeHref = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;
const safeId = /^[a-z][a-z0-9-]*$/;

/** Returns the one attribute a tag may keep: `href` on a link, `id` on a span. */
function keptAttribute(tag: string, attributes: string) {
  const name = tag === "a" ? "href" : tag === "span" ? "id" : undefined;
  if (!name) return "";
  const value = new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1];
  const valid = name === "href" ? safeHref : safeId;
  return value && valid.test(value) ? ` ${name}="${value}"` : "";
}

/**
 * Keeps only the tags and attributes that CMS text needs, and drops everything else.
 *
 * @remarks
 * Each kept tag is written again from its name, so no attribute that the allowlist does not name survives.
 * Every `<` or `>` outside a kept tag is escaped, so a broken or nested tag can only come out as text.
 */
export function sanitizeHtml(html: string) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(tagPattern, (match, close: string, name: string | undefined, attributes: string) => {
      if (!name) return match === "<" ? "&lt;" : "&gt;";
      const tag = name.toLowerCase();
      if (!allowedTags.has(tag)) return "";
      return close ? `</${tag}>` : `<${tag}${keptAttribute(tag, attributes)}>`;
    });
}
