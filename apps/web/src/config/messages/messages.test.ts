import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { expect, test } from "vitest";
import { messages } from ".";

/**
 * Lists every leaf of a message tree as `path:kind`, where kind is the type and, for a function, its arity.
 */
function shape(tree: object, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]: [string, unknown]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "function") return [`${path}:fn${value.length}`];
    if (value && typeof value === "object") return shape(value, path);
    return [`${path}:${typeof value}`];
  });
}

/**
 * Reads the leaf at a dotted path of a message tree.
 */
function leaf(tree: object, path: string) {
  return path
    .split(".")
    .reduce<unknown>((node, key) => (node as Record<string, unknown>)[key], tree);
}

const printedNames = new Set<string>([]);

test("the English and Hindi message files have the same keys", () => {
  expect(shape(messages.hi)).toEqual(shape(messages.en));
});

test("every Hindi string except a printed name contains Devanagari", () => {
  const latinOnly = shape(messages.hi)
    .filter((entry) => entry.endsWith(":string"))
    .map((entry) => entry.slice(0, -":string".length))
    .filter((path) => {
      const value = leaf(messages.hi, path);
      return (
        typeof value === "string" && /\p{L}/u.test(value) && !/\p{Script=Devanagari}/u.test(value)
      );
    });
  expect(latinOnly.filter((path) => !printedNames.has(path))).toEqual([]);
});

const src = join(import.meta.dirname, "../..");
const skipped = [
  "components/ui/",
  "config/messages/",
  "modules/design-system/",
  "modules/health/",
  "modules/kitchen-sink/",
  "modules/payments/config/policies.ts",
  "routeTree.gen.ts",
];
const copyAttributes = new Set([
  "aria-label",
  "aria-description",
  "aria-valuetext",
  "alt",
  "title",
  "placeholder",
  "label",
  "description",
  "message",
  "body",
  "heading",
]);
const copyProperties = new Set(["label", "title", "description", "message", "body", "placeholder"]);
const allowedText = new Set(["MediWise"]);

/**
 * Lists the non-test TypeScript files under a folder.
 */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const isCopy = (text: string) => /\p{L}/u.test(text) && !allowedText.has(text.trim());

/**
 * Returns the text of a string-like node, or undefined for any other node.
 */
function literalText(node: ts.Node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(" ");
  }
  return undefined;
}

/**
 * Finds user-facing text written in a source file instead of the message files.
 *
 * @remarks
 * It checks JSX text, copy attributes, copy properties such as `label`, and toast calls. Class names and keys never match these.
 */
function hardCoded(path: string) {
  const file = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const line = file.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    found.push(`${relative(src, path)}:${line} ${text.trim()}`);
  };
  const check = (node: ts.Node, value: ts.Node | undefined) => {
    const text = value && literalText(value);
    if (text && isCopy(text)) report(node, text);
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && isCopy(node.text)) report(node, node.text);
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent)) check(node, node.expression);
    if (ts.isJsxAttribute(node) && node.initializer && copyAttributes.has(node.name.getText())) {
      const init = node.initializer;
      check(node, ts.isJsxExpression(init) ? init.expression : init);
    }
    if (ts.isPropertyAssignment(node) && copyProperties.has(node.name.getText())) {
      check(node, node.initializer);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.expression.getText() === "toast"
    ) {
      check(node, node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

test("no user-facing text in apps/web/src sits outside the message files", () => {
  const files = sourceFiles(src).filter(
    (path) => !skipped.some((skip) => relative(src, path).startsWith(skip)),
  );
  expect(files.flatMap(hardCoded)).toEqual([]);
});
