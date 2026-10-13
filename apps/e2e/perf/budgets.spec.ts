import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type BrowserContext, chromium, expect, type Page, test } from "@playwright/test";
import lighthouse from "lighthouse";
import { pageFunctions } from "lighthouse/core/lib/page-functions.js";
import { apiEnv, landingOrigin, webOrigin } from "../local-env";

type Scores = Record<"performance" | "accessibility" | "best-practices" | "seo", number>;

const email = `e2e-perf-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const debugPort = 9333;
const runs = 3;
const referenceBenchmark = 2000;
const maxInpMs = 250;

const appBudget = { accessibility: 100, "best-practices": 95, seo: 58 };
const landingBudget = { performance: 75, accessibility: 100, "best-practices": 95, seo: 95 };

let context: BrowserContext;
let page: Page;
let reportPath: string;
let cpuSlowdown: number;

/**
 * Returns the Lighthouse CPU slowdown that makes this machine as slow as the reference phone.
 *
 * @remarks
 * Lighthouse simulates CPU time as the real CPU time times the slowdown, so a slower CI runner scores lower with a fixed 4x.
 * Scaling 4x by the benchmark index (4x at 2000) gives the same phone on every machine. The best of 3 samples ignores a moment of load.
 */
async function calibratedSlowdown() {
  let benchmark = 0;
  for (let sample = 0; sample < 3; sample++) {
    benchmark = Math.max(benchmark, await page.evaluate(pageFunctions.computeBenchmarkIndex));
  }
  process.stdout.write(
    `benchmark index ${benchmark}, CPU slowdown ${((4 * benchmark) / referenceBenchmark).toFixed(2)}x\n`,
  );
  return (4 * benchmark) / referenceBenchmark;
}

/**
 * Opens a signed-in browser on the dense history profile and finds its latest report.
 *
 * @remarks
 * It runs in `beforeAll`, not in a test, so a failed budget restarts the worker with a new user and the next page still runs.
 */
test.beforeAll(async () => {
  context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "mediwise-perf-")), {
    channel: "chromium",
    args: [`--remote-debugging-port=${debugPort}`],
    viewport: { width: 1440, height: 900 },
  });
  page = context.pages()[0] ?? (await context.newPage());
  cpuSlowdown = await calibratedSlowdown();

  await page.goto(`${webOrigin}/signup`);
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  const seeded = execFileSync("pnpm", ["--filter", "@mediwise/api", "db:seed-history", email], {
    env: { ...process.env, ...apiEnv },
    encoding: "utf8",
  });
  const profileId = /seeded profile=([0-9a-f-]+)/.exec(seeded)?.[1];
  if (!profileId) throw new Error(`db:seed-history printed no profile id: ${seeded}`);
  await page.evaluate((id) => localStorage.setItem("activeProfileId", id), profileId);

  await page.goto(webOrigin);
  const link = page.getByTestId("latest-report-link");
  await expect(link).toBeVisible();
  reportPath = (await link.getAttribute("href")) ?? "";
  expect(reportPath).toMatch(/^\/reports\/[0-9a-f-]+$/);
});

test.afterAll(async () => {
  await context.close();
});

/** Returns the median of an odd number of values. */
function median(values: number[]) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
}

/**
 * Runs Lighthouse on one URL `runs` times with mobile settings and returns the median score of each category.
 *
 * @remarks
 * Lighthouse opens its own tab in the signed-in browser, so `disableStorageReset` keeps the Supabase session.
 * Each HTML report is attached to the test, so a failing run shows the audits in the Playwright report.
 */
async function measure(name: string, url: string) {
  const all: Scores[] = [];
  for (let run = 1; run <= runs; run++) {
    const result = await lighthouse(url, {
      port: debugPort,
      output: "html",
      logLevel: "error",
      disableStorageReset: true,
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      throttling: { cpuSlowdownMultiplier: cpuSlowdown },
    });
    if (!result) throw new Error(`Lighthouse returned no result for ${url}`);
    const { categories } = result.lhr;
    all.push({
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      "best-practices": Math.round((categories["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    });
    const path = test.info().outputPath(`lighthouse-${name}-${run}.html`);
    writeFileSync(path, result.report as string);
    await test.info().attach(`lighthouse-${name}-${run}`, { path, contentType: "text/html" });
  }
  const scores = Object.fromEntries(
    (Object.keys(all[0]!) as (keyof Scores)[]).map((key) => [key, median(all.map((s) => s[key]))]),
  ) as Scores;
  process.stdout.write(
    `lighthouse ${name}: ${JSON.stringify(scores)}, performance runs ${all.map((s) => s.performance).join(" ")}\n`,
  );
  return scores;
}

/** Fails for each category that scores under its budget, and names the page, the score and the budget. */
function expectWithinBudget(scores: Scores, budget: Scores) {
  for (const key of Object.keys(budget) as (keyof Scores)[]) {
    expect
      .soft(scores[key], `${key} ${scores[key]} is under the budget of ${budget[key]}`)
      .toBeGreaterThanOrEqual(budget[key]);
  }
}

/**
 * Waits two frames.
 *
 * @remarks
 * Event Timing reports an interaction only after the paint that follows it.
 */
async function afterNextPaint(target: Page) {
  await target.evaluate(
    () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
  );
}

for (const { name, url, budget } of [
  { name: "home", url: () => webOrigin, budget: { ...appBudget, performance: 76 } },
  {
    name: "report",
    url: () => `${webOrigin}${reportPath}`,
    budget: { ...appBudget, performance: 78 },
  },
  { name: "trends", url: () => `${webOrigin}/trends`, budget: { ...appBudget, performance: 77 } },
  { name: "landing", url: () => landingOrigin, budget: landingBudget },
  { name: "landing-hi", url: () => `${landingOrigin}/hi`, budget: landingBudget },
]) {
  test(`Lighthouse on ${name} stays within its budget on a phone`, async () => {
    expectWithinBudget(await measure(name, url()), budget);
  });
}

type Interaction = { duration: number; event: string; target: string };

/**
 * Loads trends, clicks every category chip and both sort buttons twice, and returns the slowest interaction.
 *
 * @remarks
 * With fewer than 50 interactions on a page, INP is the slowest one. Each click waits for the paint of the one before, as a person does.
 */
async function slowestInteraction() {
  await page.goto(`${webOrigin}/trends`);
  const chips = page.locator('[data-testid^="trend-category-"]');
  await expect(chips.first()).toBeVisible();
  const controls = [
    ...(await chips.all()),
    page.getByTestId("trend-sort-name"),
    page.getByTestId("trend-sort-change"),
  ];
  for (const control of [...controls, ...controls, page.getByTestId("trend-category-all")]) {
    await control.click();
    await afterNextPaint(page);
  }
  const slow = await page.evaluate(
    () => (window as unknown as { slowInteractions: Interaction[] }).slowInteractions,
  );
  return slow.reduce((a, b) => (b.duration > a.duration ? b : a), {
    duration: 0,
    event: "none",
    target: "none",
  });
}

test(`INP on trends stays under ${maxInpMs} ms with a 4x CPU throttle`, async () => {
  await page.addInitScript(() => {
    const slow: Interaction[] = [];
    Object.assign(window, { slowInteractions: slow });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        if (!entry.interactionId) continue;
        const target = entry.target instanceof Element ? entry.target : null;
        slow.push({
          duration: entry.duration,
          event: entry.name,
          target: target?.closest("[data-testid]")?.getAttribute("data-testid") ?? "page",
        });
      }
    }).observe({ type: "event", durationThreshold: 16, buffered: true } as PerformanceObserverInit);
  });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const all: Interaction[] = [];
  for (let run = 0; run < runs; run++) all.push(await slowestInteraction());
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

  const inp = all.toSorted((a, b) => a.duration - b.duration)[Math.floor(runs / 2)]!;
  process.stdout.write(
    `inp trends: ${inp.duration} ms, runs ${all.map((i) => `${i.duration} (${i.target})`).join(" ")}\n`,
  );
  expect(inp.duration, `INP ${inp.duration} ms, ${inp.event} on ${inp.target}`).toBeLessThan(
    maxInpMs,
  );
});
