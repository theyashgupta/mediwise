import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, type Page, test } from "@playwright/test";
import { apiEnv } from "../local-env";

const fixture = (path: string) => new URL(`../../api/fixtures/${path}`, import.meta.url).pathname;
const firstScan = fixture("studies/usg-pelvis-2025-03-18.pdf");
const repeatScan = fixture("studies/usg-pelvis-2025-03-22.pdf");
const labPanel = fixture("golden/sample-2025.pdf");
const email = `e2e-follow-up-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const member = "Follow Up";

let page: Page;
const reportIds: string[] = [];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

/** Uploads one file for the member and returns the report id once the read is done. */
async function upload(file: string) {
  await page.goto("/reports/upload");
  const switcher = page.locator("main").getByTestId("profile-switcher-inline");
  await switcher.click();
  await page.getByTestId("profile-option").filter({ hasText: member }).click();
  await expect(switcher).toContainText(member);
  await page.getByTestId("upload-input").setInputFiles(file);
  await page.getByTestId("upload-submit").click();

  await expect(page).toHaveURL(/\/reports\/[0-9a-f-]{36}$/);
  await expect(page.getByTestId("report-done")).toBeVisible({ timeout: 90_000 });
  const id = new URL(page.url()).pathname.split("/").at(-1) ?? "";
  reportIds.push(id);
  return id;
}

test("a new user with three credits adds a family member profile", async () => {
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
  await page.getByTestId("profile-dob").fill("1983-05-10");
  await page.getByTestId("profile-sex").click();
  await page.getByTestId("profile-sex-female").click();
  await page.getByTestId("profile-ancestry").click();
  await page.getByTestId("profile-ancestry-unknown").click();
  await page.getByTestId("profile-permission").check();
  await page.getByTestId("profile-submit").click();

  await expect(page.getByTestId("profile-card").filter({ hasText: member })).toBeVisible();
});

test("the first pelvis ultrasound shows the adnexal mass as a finding", async () => {
  await upload(firstScan);

  await expect(page.getByTestId("finding-study_alert")).toContainText(/mass/i);
});

test("a repeat ultrasound four days later links to the first one with no form", async () => {
  await upload(repeatScan);

  const link = page.getByTestId("report-link-later");
  await expect(link).toBeVisible();
  await expect(link.getByTestId("report-link-detected")).toBeVisible();
  await expect(link.getByTestId("report-link-dismiss")).toBeVisible();
});

test("the first report moves the mass to Settled with both study dates and the second lab", async () => {
  await page.goto(`/reports/${reportIds[0]}`);

  await expect(page.getByTestId("report-link-earlier")).toBeVisible();
  const settled = page.getByTestId("settled-findings");
  await expect(settled).toContainText("18 Mar 2025");
  await expect(settled).toContainText("22 Mar 2025");
  await expect(settled).toContainText("Riverside Diagnostics");
  await expect(page.getByTestId("finding-study_alert")).toHaveCount(0);
});

test("a third report within 45 days makes the profile propose an episode, and saving it lists it", async () => {
  await upload(labPanel);
  await expect(page.getByTestId("score-value")).toHaveText("88");

  await page.goto("/profiles");
  const proposal = page.getByTestId("episode-proposal");
  await expect(proposal).toBeVisible();
  await proposal.getByTestId("episode-proposal-name").fill("Pelvis workup");
  await proposal.getByTestId("episode-proposal-save").click();

  await expect(page.getByTestId("episode-list")).toContainText("Pelvis workup");
  await expect(page.getByTestId("episode-proposal")).toHaveCount(0);
});

test("a share link opens the doctor export with no session", async ({ browser }) => {
  await page.goto(`/reports/${reportIds[2]}`);
  await page.getByTestId("report-share").click();
  const url = await page.getByTestId("share-link").inputValue();
  expect(url).toMatch(/\/share\/[\w-]+$/);
  await page.keyboard.press("Escape");

  const guest = await browser.newContext();
  const shared = await guest.newPage();
  await shared.goto(url);
  await expect(shared.getByTestId("report-export")).toContainText("Sunrise Diagnostics");
  await expect(shared.getByTestId("export-download-pdf")).toBeVisible();
  await expect(shared).toHaveTitle(/-mediwise$/);
  await expect(shared.getByTestId("user-menu")).toHaveCount(0);
  await guest.close();
});

test("Settings downloads the CSV of the active profile with the lab values", async () => {
  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("profile-csv").click(),
  ]);
  const csv = await readFile(await download.path(), "utf8");

  expect(download.suggestedFilename()).toMatch(/\.csv$/);
  expect(csv.split("\n").find((row) => row.includes(",vitamin_d,"))).toContain(",13,");
});

test("in Hindi the report page keeps its values and shows Hindi text", async () => {
  await page.goto("/settings");
  await page.getByTestId("language-select").click();
  await page.getByTestId("language-option-hi").click();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");

  await page.goto(`/reports/${reportIds[2]}`);
  await expect(page.getByTestId("report-done")).toBeVisible();
  await expect(page.getByTestId("score-value")).toHaveText("88");
  await expect(page.getByTestId("marker-row-vitamin_d")).toContainText("13");
  await expect(page.getByTestId("report-done")).toContainText(/[ऀ-ॿ]/);
});
