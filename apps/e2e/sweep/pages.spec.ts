import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { type Browser, type Page, test } from "@playwright/test";

const label = process.env.SWEEP_LABEL;
const only = process.env.SWEEP_PAGES?.split(",");
const widths = (process.env.SWEEP_WIDTHS ?? "390,1280").split(",").map(Number);
const outDir = new URL("../../../docs/design/pages/", import.meta.url);
const resultsDir = new URL("../test-results/", import.meta.url);
const themes = ["light", "dark"] as const;
const email = "arjun.demo@example.com";
const slots = [
  "button",
  "input",
  "textarea",
  "select-trigger",
  "checkbox",
  "switch",
  "tabs-trigger",
  "badge",
  "card",
  "dialog-trigger",
  "dropdown-menu-trigger",
  "sheet-trigger",
  "label",
] as const;

type Theme = (typeof themes)[number];
type Target = { name: string; path: string };

const signedOut: Target[] = [
  { name: "login", path: "/login" },
  { name: "signup", path: "/signup" },
  { name: "forgot-password", path: "/forgot-password" },
  { name: "reset-password", path: "/reset-password" },
  { name: "privacy", path: "/privacy" },
  { name: "terms", path: "/terms" },
  { name: "refunds", path: "/refunds" },
  { name: "contact", path: "/contact" },
];

const signedIn: Target[] = [
  { name: "home", path: "/" },
  { name: "reports", path: "/reports" },
  { name: "upload", path: "/reports/upload" },
  { name: "trends", path: "/trends" },
  { name: "compare", path: "/compare" },
  { name: "ask", path: "/ask" },
  { name: "credits", path: "/credits" },
  { name: "profiles", path: "/profiles" },
  { name: "settings", path: "/settings" },
  { name: "year-review", path: "/year-review" },
  { name: "admin", path: "/admin" },
  { name: "design", path: "/design" },
  { name: "kitchen-sink", path: "/dev/kitchen-sink" },
];

const inventory: Record<string, Record<string, number>> = {};

/** Waits until the page stops loading data, with a cap for pages that keep a request open. */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(800);
}

async function open(browser: Browser, width: number, theme: Theme, storageState?: string) {
  const context = await browser.newContext({
    viewport: { width, height: width < 768 ? 844 : 800 },
    colorScheme: theme,
    storageState,
  });
  await context.addInitScript((value) => localStorage.setItem("theme", value), theme);
  return context;
}

async function countControls(page: Page) {
  return page.evaluate((names) => {
    const counts: Record<string, number> = {};
    for (const slot of names) {
      counts[slot] = document.querySelectorAll(`[data-slot="${slot}"]`).length;
    }
    counts["native-button"] = document.querySelectorAll("button:not([data-slot])").length;
    counts["native-input"] = document.querySelectorAll("input:not([data-slot])").length;
    counts["native-select"] = document.querySelectorAll("select").length;
    return counts;
  }, slots);
}

async function capture(browser: Browser, targets: Target[], storageState?: string) {
  for (const width of widths) {
    for (const theme of themes) {
      const context = await open(browser, width, theme, storageState);
      const page = await context.newPage();
      for (const target of targets) {
        if (only && !only.includes(target.name)) continue;
        await page.goto(target.path);
        await settle(page);
        await page.screenshot({
          path: fileURLToPath(new URL(`${label}-${target.name}-${theme}-${width}.jpg`, outDir)),
          fullPage: true,
          type: "jpeg",
          quality: 70,
          animations: "disabled",
        });
        if (width === 1280 && theme === "light") {
          inventory[target.name] = await countControls(page);
        }
      }
      await context.close();
    }
  }
}

async function firstLink(page: Page, path: string, pattern: RegExp) {
  await page.goto(path);
  await settle(page);
  const hrefs = await page
    .locator("a[href]")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
  return hrefs.find((href) => pattern.test(href));
}

test("every web page at each width and theme", async ({ browser }) => {
  const password = process.env.MEDIWISE_DEMO_PASSWORD;
  if (!label) throw new Error("Set SWEEP_LABEL, for example before-medi-191.");
  if (!password) throw new Error("MEDIWISE_DEMO_PASSWORD is not set. Run through with-env.sh.");
  mkdirSync(resultsDir, { recursive: true });

  await capture(browser, signedOut);

  const statePath = fileURLToPath(new URL("sweep-state.json", resultsDir));
  const login = await browser.newContext();
  const page = await login.newPage();
  await page.goto("/login");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });

  const report = await firstLink(page, "/reports", /^\/reports\/[0-9a-f-]{36}$/);
  const marker = report && (await firstLink(page, report, /^\/reports\/[^/]+\/markers\/[^/]+$/));
  const trend = await firstLink(page, "/trends", /^\/trends\/[^/]+$/);
  const episode = await firstLink(page, "/profiles", /^\/episodes\/[^/]+$/);
  await login.storageState({ path: statePath });
  await login.close();

  const found: Target[] = [
    ...(report
      ? [
          { name: "report", path: report },
          { name: "export", path: `${report}/export` },
        ]
      : []),
    ...(marker ? [{ name: "marker", path: marker }] : []),
    ...(trend ? [{ name: "trend", path: trend }] : []),
    ...(episode ? [{ name: "episode", path: episode }] : []),
  ];
  await capture(browser, [...signedIn, ...found], statePath);

  writeFileSync(
    new URL(`sweep-inventory-${label}.json`, resultsDir),
    JSON.stringify(
      { skipped: { share: "needs a share token, the sweep never creates one" }, found, inventory },
      null,
      2,
    ),
  );
});
