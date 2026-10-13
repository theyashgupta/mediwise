#!/usr/bin/env node
/**
 * Renders every auth email in supabase/templates with sample values to docs/design/emails, as HTML and PNG.
 *
 * @remarks
 * Run after a template changes, then commit the output: `node scripts/render-email-previews.mjs`.
 * The PNG comes from headless Chrome, so no package is added. Set CHROME to its path on a machine without /Applications.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const templatesDir = new URL("../supabase/templates/", import.meta.url);
const outDir = new URL("../docs/design/emails/", import.meta.url);
const chrome =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sample = {
  ConfirmationURL: "https://adnvhcharmqykmlyrepq.supabase.co/auth/v1/verify?token=sample",
  Email: "arjun.demo@example.com",
  NewEmail: "arjun.new@example.com",
  SiteURL: "https://app.mediwise.theyashgupta.me",
  RedirectTo: "https://app.mediwise.theyashgupta.me/",
  Token: "123456",
  TokenHash: "sample",
};

/**
 * Throws when a template breaks a rule that Gmail or the ticket sets.
 *
 * @remarks
 * Gmail drops SVG, data URIs and, for some accounts, the whole style block, so every style stays inline.
 */
function check(name, html) {
  const links = html.match(/<a\s/g) ?? [];
  const problems = [
    links.length !== 1 && `${links.length} links, expected one action link`,
    !html.includes('href="{{ .ConfirmationURL }}"') && "the link is not {{ .ConfirmationURL }}",
    /<(script|style|svg)\b/i.test(html) && "a script, style or svg element",
    /src="(?!https:\/\/)/.test(html) && "an image that is not on https",
    /\{\{(?!\s*\.(\w+)\s*\}\})/.test(html) && "a template tag that is not a plain variable",
  ].filter(Boolean);
  if (problems.length) throw new Error(`${name}: ${problems.join(", ")}`);
}

mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(templatesDir).filter((f) => f.endsWith(".html"))) {
  const template = readFileSync(new URL(file, templatesDir), "utf8");
  check(file, template);
  const html = template.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (tag, key) => {
    if (!(key in sample)) throw new Error(`${file}: no sample value for ${tag}`);
    return sample[key];
  });
  const htmlUrl = new URL(file, outDir);
  writeFileSync(htmlUrl, html);
  execFileSync(chrome, [
    "--headless=new",
    "--hide-scrollbars",
    "--window-size=600,560",
    `--screenshot=${fileURLToPath(new URL(file.replace(".html", ".png"), outDir))}`,
    htmlUrl.href,
  ], { stdio: "ignore" });
  process.stdout.write(`${file}\n`);
}
