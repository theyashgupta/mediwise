import { execFileSync } from "node:child_process";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { apiEnv } from "../local-env";

const email = `e2e-dense-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const profileName = "Dense History";
const dayMs = 86_400_000;

let page: Page;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

/** Fails when two of the text boxes in a chart overlap: value labels, date ticks and value ticks. */
async function expectNoOverlap(texts: Locator) {
  const boxes = (await texts.evaluateAll((nodes) =>
    nodes
      .filter((node) => node.textContent?.trim())
      .map((node) => {
        const { x, y, width, height } = node.getBoundingClientRect();
        return { x, y, width, height };
      }),
  )) as { x: number; y: number; width: number; height: number }[];
  for (const [i, a] of boxes.entries()) {
    for (const b of boxes.slice(i + 1)) {
      const apart =
        a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y;
      expect(apart, `labels at x=${a.x} and x=${b.x} overlap`).toBe(true);
    }
  }
}

test("a new user gets a profile with 12 reports in 10 weeks", async () => {
  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  execFileSync("pnpm", ["--filter", "@mediwise/api", "db:seed-history", email], {
    env: { ...process.env, ...apiEnv },
    stdio: "ignore",
  });

  await page.goto("/");
  const switcher = page.getByTestId("profile-switcher-sidebar");
  await switcher.click();
  await page.getByTestId("profile-option").filter({ hasText: profileName }).click();
  await expect(switcher).toContainText(profileName);
});

test("Home compares the score with the report of one week before and shows no stale line", async () => {
  const weekBefore = new Date(Date.now() - 7 * dayMs).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  await expect(page.getByTestId("latest-score-change")).toContainText(weekBefore);
  await expect(page.getByTestId("retest-row-hba1c")).toHaveCount(0);
  const row = page.getByTestId("family-row").filter({ hasText: profileName });
  await expect(row).toBeVisible();
  await expect(row.getByTestId("family-stale")).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`the glucose trend at ${width} px shows one point per day without overlapping labels`, async () => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/trends/glucose_fasting");
    await expect(page.getByTestId("value-chart")).toBeVisible();
    await expect(page.locator('[data-testid^="trend-point-"]')).toHaveCount(12);
    const chart = page.getByTestId("value-chart");
    await expect(chart.locator(".recharts-line-dots circle").first()).toBeVisible();
    const texts = chart.locator("text");
    expect(await texts.count()).toBeGreaterThan(8);
    await expectNoOverlap(texts);
  });
}

test("compare takes the first and the last report, and one report never sits on both sides", async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/compare");
  await page.getByTestId("report-a").click();
  await page.getByTestId("report-a-option").last().click();
  await page.getByTestId("report-b").click();
  await expect(page.getByTestId("report-b-option").last()).toHaveAttribute("data-disabled");
  await page.getByTestId("report-b-option").first().click();
  await expect(page.getByTestId("compare-summary")).toBeVisible();
});
