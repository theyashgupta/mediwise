import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { apiEnv } from "../local-env";

const sample = new URL("../../api/fixtures/golden/sample-2025.pdf", import.meta.url);
const email = `e2e-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const member = "Test Member";

let page: Page;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

test("a new user signs up with email and gets one report credit", async () => {
  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  execFileSync("pnpm", ["--filter", "@mediwise/api", "credits:grant", email, "1", "e2e"], {
    env: { ...process.env, ...apiEnv },
    stdio: "ignore",
  });
});

test("the user adds a family member profile", async () => {
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
});

test("the user uploads the 2025 sample and the read reaches done", async () => {
  await page.goto("/reports/upload");
  const switcher = page.locator("main").getByTestId("profile-switcher-inline");
  await switcher.click();
  await page.getByTestId("profile-option").filter({ hasText: member }).click();
  await expect(switcher).toContainText(member);
  await page.getByTestId("upload-input").setInputFiles(sample.pathname);
  await page.getByTestId("upload-submit").click();

  await expect(page).toHaveURL(/\/reports\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("report-done")).toBeVisible({ timeout: 90_000 });
});

test("the report shows the score and the golden marker values", async () => {
  await expect(page.getByTestId("score-value")).toHaveText("89");
  await expect(page.getByTestId("marker-row-vitamin_d")).toContainText("13");
  await expect(page.getByTestId("marker-row-ldl_cholesterol")).toContainText("150");
  await expect(page.getByTestId("marker-row-tsh")).toContainText("5.3");
});

test("the doctor export opens with the report values", async () => {
  const popup = page.waitForEvent("popup");
  await page.getByTestId("report-export-link").click();
  const exportPage = await popup;
  await expect(exportPage.getByTestId("report-export")).toContainText("Sunrise Diagnostics");
  await exportPage.close();
});

test("the profile CSV holds every value of the report", async () => {
  await page.goto("/profiles");
  const card = page.getByTestId("profile-card").filter({ hasText: member });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    card.getByTestId("profile-csv").click(),
  ]);
  const csv = await readFile(await download.path(), "utf8");

  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  expect(csv.split("\n").find((row) => row.includes(",vitamin_d,"))).toContain(",13,");
});

test("the user signs out and lands on the sign-in page", async () => {
  await page.getByTestId("user-menu").click();
  await page.getByTestId("sign-out").click();

  await expect(page).toHaveURL(/\/login/);
});
