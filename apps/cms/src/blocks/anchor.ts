import type { Block } from "payload";

const anchorPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Accepts a heading anchor made of lowercase letters, digits and single hyphens.
 */
export function validateAnchorId(value: null | string | undefined) {
  return typeof value === "string" && anchorPattern.test(value)
    ? true
    : "Use lowercase letters and digits, with one hyphen between two groups.";
}

export const anchor: Block = {
  slug: "anchor",
  fields: [{ name: "anchorId", type: "text", required: true, validate: validateAnchorId }],
};
