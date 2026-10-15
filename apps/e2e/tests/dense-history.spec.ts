import { execFileSync } from "node:child_process";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { apiEnv, apiPort } from "../local-env";

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
  await page.getByTestId("auth-consent-terms").check();
  await page.getByTestId("auth-consent-health_data").check();
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

/** Formats the day `days` before today as Home prints it, for example "6 Oct". */
function daysBefore(days: number) {
  return new Date(Date.now() - days * dayMs).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

test("Home compares the full panel with the previous full panel, lists the narrow reports since it and shows no stale line", async () => {
  await expect(page.getByTestId("latest-score-change")).toContainText(daysBefore(70));
  const newSince = page.getByTestId("new-since-row");
  await expect(newSince).toHaveCount(3);
  for (const [index, days] of [0, 7, 14].entries()) {
    await expect(newSince.nth(index)).toContainText(daysBefore(days));
  }
  await expect(page.getByTestId("retest-row-hba1c")).toHaveCount(0);
  const row = page.getByTestId("family-row").filter({ hasText: profileName });
  await expect(row).toBeVisible();
  await expect(row.getByTestId("family-stale")).toHaveCount(0);
});

test("Home lists what needs attention across every report, and the risk chip keeps B12 and drops watch rows", async () => {
  const rows = page.getByTestId("attention-row");
  await expect(rows.filter({ hasText: "Vitamin B12" })).toHaveCount(1);
  await expect(rows.filter({ hasText: /^HbA1c/ })).toHaveCount(0);
  const all = await rows.count();
  await page.getByTestId("attention-filter-risk").click();
  await expect(rows.filter({ hasText: "Vitamin B12" })).toHaveCount(1);
  expect(await rows.count()).toBeLessThan(all);
  await page.getByTestId("attention-filter-all").click();
  await expect(rows).toHaveCount(all);
});

test("Home leads with the overview blocks, each suggestion block ends with the disclaimer, and the year in review and family stay", async () => {
  await page.goto("/");
  const patterns = page.getByRole("region", { name: "Patterns across reports" });
  await expect(patterns.getByTestId("pattern-row").first()).toBeVisible();
  const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
  const order = [
    "Needs attention",
    "See a doctor",
    "Patterns across reports",
    "Habits and questions for your doctor",
    "Your latest report",
    "Year in review",
    "Your family",
    "Recent reports",
  ].map((title) => headings.indexOf(title));
  expect(
    order.every((index) => index >= 0),
    headings.join(" | "),
  ).toBe(true);
  expect(order).toEqual(order.toSorted((a, b) => a - b));

  await expect(
    patterns.getByTestId("pattern-row").filter({ hasText: "B12 deficiency" }),
  ).toHaveCount(1);
  await expect(
    patterns.getByTestId("pattern-row").filter({ hasText: "Prediabetes" }),
  ).toContainText("Cleared");
  for (const name of [
    "See a doctor",
    "Patterns across reports",
    "Habits and questions for your doctor",
  ]) {
    await expect(
      page.getByRole("region", { name }).getByTestId("suggestion-disclaimer"),
    ).toHaveText("MediWise is for information. Ask your doctor before you act on this.");
  }
});

test("Trends keeps an eye on B12, filters by direction and status through the URL and ends each suggestion with the doctor line", async () => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/trends");
  await expect(page.getByTestId("watch-row").filter({ hasText: "Vitamin B12" })).toHaveCount(1);
  const suggestions = page.getByTestId("trend-suggestion");
  await expect(suggestions.first()).toBeVisible();
  const all = await suggestions.count();
  for (const text of await suggestions.allTextContents()) {
    expect(text).toMatch(/Ask your doctor before you act on this\.$/);
  }

  await page.getByTestId("trend-direction-worsening").click();
  await expect(page).toHaveURL(/direction=worsening/);
  await page.getByTestId("trend-status-watch").click();
  await expect(page).toHaveURL(/status=watch/);
  await page.reload();
  await expect(page.getByTestId("trend-direction-worsening")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("trend-status-watch")).toHaveAttribute("aria-pressed", "true");
  expect(await suggestions.count()).toBeLessThan(all);

  await page.goto("/trends?category=none&direction=stable");
  await expect(suggestions).toHaveCount(0);
  await page.getByTestId("trend-clear-filters").click();
  await expect(suggestions).toHaveCount(all);
  await expect(page).not.toHaveURL(/direction=/);
});

test("a trend page shows the suggestion with the doctor line", async () => {
  await page.goto("/trends/glucose_fasting");
  await expect(page.getByTestId("trend-detail-suggestion")).toContainText(
    "Ask your doctor before you act on this.",
  );
});

test("a report opened low on Home starts at the top, and back restores the Home scroll offset", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const link = page.getByTestId("recent-report-link").last();
  await link.scrollIntoViewIfNeeded();
  const offset = await page.evaluate(() => window.scrollY);
  expect(offset).toBeGreaterThan(500);

  await link.click();
  await expect(page).toHaveURL(/\/reports\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("report-done")).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();

  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(offset);
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

/** Counts the pages of a PDF that Chromium wrote, from its page objects. */
function pdfPages(pdf: Buffer) {
  return pdf.toString("latin1").match(/\/Type\s*\/Page\b(?!s)/g)?.length ?? 0;
}

/**
 * Returns the full panel with the most markers and an earlier full panel, so the export has the widest rows.
 *
 * @remarks
 * The reports list response gives the ids. The seeded reports have no title, so the page text cannot pick the report.
 */
async function latestFullPanelId() {
  const listed = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).port === String(apiPort) &&
      new URL(response.url()).pathname === "/reports",
  );
  await page.goto("/reports");
  const { items } = (await (await listed).json()) as {
    items: { id: string; markerCount: number; collectedAt: string }[];
  };
  const panels = items
    .filter((item) => item.markerCount >= 80)
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
  expect(panels.length, "two full panels in the dense history").toBe(2);
  return panels[0]!.id;
}

for (const locale of ["en", "hi"] as const) {
  test(`the doctor export in ${locale} keeps every marker row whole and the footer on each A4 and Letter page`, async () => {
    await page.setViewportSize({ width: 1440, height: 900 });
    if (locale === "hi") {
      await page.goto("/settings");
      await page.getByTestId("language-select").click();
      await page.getByTestId("language-option-hi").click();
      await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    }
    const reportId = await latestFullPanelId();
    await page.goto(`/reports/${reportId}/export`);
    await expect(page.getByTestId("export-download-pdf")).toBeVisible();

    const boxes = page.getByTestId("export-pages").locator("[data-page]");
    await expect(boxes.first()).toBeAttached();
    const layout = await page.evaluate(() => {
      const empty = document.querySelector<HTMLElement>("[data-flow] ~ [data-page]")!;
      const pages = [...document.querySelectorAll<HTMLElement>('[data-testid="export-pages"] > *')];
      return {
        rows: document.querySelectorAll("[data-flow] tr[data-atom]").length,
        placed: pages.flatMap((box) =>
          [...box.querySelectorAll<HTMLElement>("[data-atom]")].map((atom) => atom.dataset.atom),
        ),
        atoms: document.querySelectorAll("[data-flow] [data-atom]").length,
        pagedRows: pages.reduce(
          (sum, box) => sum + box.querySelectorAll("tr[data-atom]").length,
          0,
        ),
        tallest: Math.max(...pages.map((box) => box.offsetHeight)),
        limit: empty.offsetHeight,
        footers: pages.map((box) => box.querySelector("footer")?.textContent ?? ""),
      };
    });
    expect(layout.rows, "the dense full panel has its marker rows").toBeGreaterThan(80);
    expect(layout.pagedRows).toBe(layout.rows);
    expect(new Set(layout.placed).size).toBe(layout.atoms);
    expect(layout.placed).toHaveLength(layout.atoms);
    expect(layout.tallest, "no page box grows past one page").toBeLessThanOrEqual(layout.limit);
    expect(layout.footers.length).toBeGreaterThan(1);
    for (const footer of layout.footers) expect(footer).toContain("Moon Labs");

    for (const format of ["A4", "Letter"] as const) {
      const pdf = await page.pdf({
        format,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      });
      expect(pdfPages(pdf), `${format}: one PDF page per page box`).toBe(layout.footers.length);
    }
  });
}
