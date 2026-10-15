import { execFileSync } from "node:child_process";
import { expect, type Locator, type Page, type Request, test } from "@playwright/test";
import { apiEnv } from "../local-env";

const labPanel = new URL("../../api/fixtures/golden/sample-2025.pdf", import.meta.url).pathname;
const email = `e2e-ask-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const member = "Ask Member";

let page: Page;
let reportId = "";

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

/** Sends one question from the Ask page and waits for its stored answer. */
async function ask(question: string) {
  const items = page.getByTestId("assistant-item");
  const before = await items.count();
  await page.getByTestId("assistant-input").fill(question);
  await page.getByTestId("assistant-send").click();
  await expect(items).toHaveCount(before + 1, { timeout: 30_000 });
}

test("a new user with three credits reads one report for a family member", async () => {
  test.setTimeout(150_000);
  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-consent-terms").check();
  await page.getByTestId("auth-consent-health_data").check();
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();
  execFileSync("pnpm", ["--filter", "@mediwise/api", "credits:grant", email, "3", "e2e"], {
    env: { ...process.env, ...apiEnv },
    stdio: "ignore",
  });

  await page.goto("/profiles");
  await page.getByTestId("profile-add").click();
  await page.getByTestId("profile-name").fill(member);
  await page.getByTestId("profile-relation").click();
  await page.getByTestId("profile-relation-parent").click();
  await page.getByTestId("profile-dob").fill("1965-04-12");
  await page.getByTestId("profile-sex").click();
  await page.getByTestId("profile-sex-male").click();
  await page.getByTestId("profile-ancestry").click();
  await page.getByTestId("profile-ancestry-unknown").click();
  await page.getByTestId("profile-permission").check();
  await page.getByTestId("profile-submit").click();
  await expect(page.getByTestId("profile-card").filter({ hasText: member })).toBeVisible();

  await page.goto("/reports/upload");
  const switcher = page.locator("main").getByTestId("profile-switcher-inline");
  await switcher.click();
  await page.getByTestId("profile-option").filter({ hasText: member }).click();
  await expect(switcher).toContainText(member);
  await page.getByTestId("upload-input").setInputFiles(labPanel);
  await page.getByTestId("upload-submit").click();
  await expect(page).toHaveURL(/\/reports\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("report-done")).toBeVisible({ timeout: 90_000 });
  reportId = new URL(page.url()).pathname.split("/").at(-1) ?? "";
});

test("asking from the report page gives an answer with a chip, and back from the chip keeps the chat", async () => {
  await page.getByTestId("report-ask-link").click();
  await expect(page).toHaveURL(new RegExp(`/ask\\?report=${reportId}$`));

  await ask("Which reports do I have?");
  const answer = page.getByTestId("assistant-item").last();
  await expect(answer.getByTestId("assistant-answer")).toBeVisible();
  const chip = answer.getByTestId("assistant-chip").first();
  await expect(chip).toBeVisible();

  await chip.click();
  await expect(page).toHaveURL(new RegExp(`/reports/${reportId}`));
  await page.goBack();

  await expect(page).toHaveURL(/\/ask/);
  await expect(page.getByTestId("assistant-item")).toHaveCount(1);
  await expect(
    page.getByTestId("assistant-item").last().getByTestId("assistant-chip"),
  ).toBeVisible();
});

/** Sends one question with a double click on Send and two Enter presses, and returns how many requests went out. */
async function doubleSend(scope: Page | Locator, question: string) {
  const sent: string[] = [];
  const count = (request: Request) => {
    if (request.method() === "POST" && request.url().endsWith("/questions")) sent.push(question);
  };
  const items = scope.getByTestId("assistant-item");
  const before = await items.count();
  const input = scope.getByTestId("assistant-input");
  await input.fill(question);
  page.on("request", count);
  await scope.getByTestId("assistant-send").dblclick();
  await input.press("Enter");
  await input.press("Enter");
  await expect(items).toHaveCount(before + 1, { timeout: 30_000 });
  page.off("request", count);
  return sent.length;
}

test("a double click on Send and two Enter presses send one question, on the Ask page and in the widget", async () => {
  expect(await doubleSend(page, "Which reports do I have now?")).toBe(1);

  await page.goto(`/reports/${reportId}`);
  await page.getByTestId("ask-launcher").click();
  const panel = page.getByTestId("ask-panel");
  await expect(panel.getByTestId("assistant-item")).toHaveCount(2);
  expect(await doubleSend(panel, "How many reports do I have?")).toBe(1);

  await page.goto("/ask");
  await expect(page.getByTestId("assistant-item")).toHaveCount(3);
});

test("with no questions left, one tap on Use 1 credit debits exactly one credit", async () => {
  for (let left = 2; left > 0; left--) await ask(`Question ${left}?`);
  await expect(page.getByTestId("assistant-use-credit")).toBeVisible();

  await page.goto("/credits");
  await expect(page.getByTestId("credits-balance")).toHaveText(/\b2\b/);
  await page.goBack();

  await page.getByTestId("assistant-use-credit").click();
  await expect(page.getByTestId("assistant-out")).toHaveCount(0);
  await expect(page.getByTestId("assistant-input")).toBeEnabled();

  await page.goto("/credits");
  await expect(page.getByTestId("credits-balance")).toHaveText(/\b1\b/);
});
