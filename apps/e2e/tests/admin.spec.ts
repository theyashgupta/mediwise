import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { adminUserId, apiEnv, apiPort, webEnv } from "../local-env";

const sample = new URL("../../api/fixtures/golden/sample-2025.pdf", import.meta.url);
const adminEmail = "arjun.demo@example.com";
const ownerEmail = `e2e-admin-owner-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const profileName = "Dense History";
const authUrl = `${apiEnv.SUPABASE_URL}/auth/v1`;
const adminRoutes = [
  ["GET", "/admin/credits"],
  ["GET", "/admin/failed-reports"],
  ["GET", "/admin/spend"],
  ["POST", "/admin/reports/00000000-0000-4000-8000-000000000000/retry"],
] as const;

type Total = { kind: string; events: number; credits: number; amountPaise: number };
type CreditEvent = { userId: string; kind: string };
type History = Record<
  "reportCredits" | "questionPacks",
  { totals: Total[]; events: CreditEvent[] }
>;

let adminPage: Page;
let ownerPage: Page;
let ownerToken: string;
let failedReportId: string;
let ownerId: string;

test.describe.configure({ mode: "serial" });

/**
 * Runs SQL on the e2e database with the API's own Postgres client.
 *
 * @remarks
 * The dense fixture holds only done reports, so the failed read needs a row update of its own.
 */
function sql(query: string) {
  const script =
    'import postgres from "postgres"; const db = postgres(process.env.DATABASE_URL); await db.unsafe(process.argv[1]); await db.end();';
  execFileSync(
    "pnpm",
    ["--filter", "@mediwise/api", "exec", "node", "--input-type=module", "-e", script, query],
    { env: { ...process.env, ...apiEnv }, stdio: ["ignore", "ignore", "pipe"] },
  );
}

/** Signs in through the local Supabase Auth API and returns the access token. */
async function accessToken(email: string) {
  const res = await fetch(`${authUrl}/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: webEnv.VITE_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(res.ok, `sign-in of ${email}`).toBe(true);
  return ((await res.json()) as { access_token: string }).access_token;
}

function callApi(method: string, path: string, token?: string) {
  return fetch(`http://localhost:${apiPort}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function ownerCredits() {
  return ((await (await callApi("GET", "/me", ownerToken)).json()) as { credits: number }).credits;
}

async function reportStatus(id: string) {
  const res = await callApi("GET", `/reports/${id}`, ownerToken);
  return ((await res.json()) as { status: string }).status;
}

/** Signs in on the web with the email form and waits for the app shell. */
async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();
}

/**
 * Creates the demo account with the fixed id that the e2e API gets as ADMIN_USER_ID.
 *
 * @remarks
 * The local database keeps users between runs, so an existing account (422) is fine.
 */
async function ensureAdminUser() {
  const key = apiEnv.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${authUrl}/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: adminUserId, email: adminEmail, password, email_confirm: true }),
  });
  expect([200, 422]).toContain(res.status);
}

test.beforeAll(async ({ browser }) => {
  await ensureAdminUser();
  adminPage = await browser.newPage();
  ownerPage = await browser.newPage();
});

test.afterAll(async () => {
  await adminPage.close();
  await ownerPage.close();
});

test("without a session the admin routes return 401", async () => {
  for (const [method, path] of adminRoutes) {
    expect((await callApi(method, path)).status, `${method} ${path}`).toBe(401);
  }
});

test("a user who is not the admin gets Not Found on /admin with no breadcrumb or link, and 404 from the admin routes", async () => {
  await ownerPage.goto("/signup");
  await ownerPage.getByTestId("auth-email").fill(ownerEmail);
  await ownerPage.getByTestId("auth-password").fill(password);
  await ownerPage.getByTestId("auth-consent-terms").check();
  await ownerPage.getByTestId("auth-consent-health_data").check();
  await ownerPage.getByTestId("auth-submit").click();
  await expect(ownerPage.getByTestId("user-menu")).toBeVisible();
  ownerToken = await accessToken(ownerEmail);
  ownerId = (JSON.parse(atob(ownerToken.split(".")[1] ?? "")) as { sub: string }).sub;

  await ownerPage.goto("/admin");
  await expect(ownerPage.getByText("Not Found")).toBeVisible();
  await expect(ownerPage.getByRole("heading", { name: "Operator" })).toHaveCount(0);
  await expect(ownerPage.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  await expect(ownerPage.locator('a[href="/admin"]')).toHaveCount(0);
  for (const [method, path] of adminRoutes) {
    expect((await callApi(method, path, ownerToken)).status, `${method} ${path}`).toBe(404);
  }
});

test("the owner gets the dense history and one failed read with its credit returned", async () => {
  test.setTimeout(150_000);
  const env = { ...process.env, ...apiEnv };
  execFileSync("pnpm", ["--filter", "@mediwise/api", "db:seed-history", ownerEmail], {
    env,
    stdio: "ignore",
  });
  execFileSync("pnpm", ["--filter", "@mediwise/api", "credits:grant", ownerEmail, "1", "e2e"], {
    env,
    stdio: "ignore",
  });

  await ownerPage.goto("/reports/upload");
  const switcher = ownerPage.locator("main").getByTestId("profile-switcher-inline");
  await switcher.click();
  await ownerPage.getByTestId("profile-option").filter({ hasText: profileName }).click();
  await expect(switcher).toContainText(profileName);
  await ownerPage.getByTestId("upload-input").setInputFiles(sample.pathname);
  await ownerPage.getByTestId("upload-submit").click();
  await expect(ownerPage).toHaveURL(/\/reports\/[0-9a-f-]{36}$/);
  await expect(ownerPage.getByTestId("report-done")).toBeVisible({ timeout: 90_000 });
  failedReportId = new URL(ownerPage.url()).pathname.split("/").at(-1) ?? "";

  sql(`
    update reports set status = 'failed', error = 'You have no report credits left.' where id = '${failedReportId}';
    insert into credits_ledger (user_id, delta, reason, report_id)
      select user_id, 1, 'refund', report_id from credits_ledger where report_id = '${failedReportId}';
  `);
  expect(await ownerCredits()).toBe(1);
});

test("the admin sees the credit history totals as GET /admin/credits returns them, in rupees, with no dollar figure", async () => {
  await signIn(adminPage, adminEmail);
  const loaded = adminPage.waitForResponse(
    (res) =>
      res.request().method() === "GET" &&
      new URL(res.url()).port === String(apiPort) &&
      new URL(res.url()).pathname === "/admin/credits",
  );
  await adminPage.goto("/admin");
  const history = (await (await loaded).json()) as History;
  await expect(adminPage.getByRole("heading", { name: "Operator" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "Report credits" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "Question packs" })).toBeVisible();

  for (const total of [...history.reportCredits.totals, ...history.questionPacks.totals]) {
    await expect(adminPage.getByTestId(`admin-total-${total.kind}`), total.kind).toHaveText(
      total.events.toLocaleString("en-GB"),
    );
  }
  await expect(adminPage.locator("main")).not.toContainText("$");
  await expect(adminPage.getByText(/Claude spend|cost per read/i)).toHaveCount(0);

  await expect(adminPage.getByTestId(`admin-failed-${failedReportId}`)).toContainText(
    "No credits left",
  );
});

test("a click on a user id shows only that user's events", async () => {
  const filtered = adminPage.waitForResponse(
    (res) => new URL(res.url()).searchParams.get("userId") === ownerId,
  );
  await adminPage.getByTitle(ownerId).first().click();
  const history = (await (await filtered).json()) as History;

  await expect(adminPage.getByTestId("admin-user-filter")).toContainText(ownerId.slice(0, 8));
  const kinds = history.reportCredits.events.map((event) => event.kind);
  expect(kinds).toEqual(expect.arrayContaining(["grant", "upload", "refund"]));
  expect(history.reportCredits.events.every((event) => event.userId === ownerId)).toBe(true);
  await expect(
    adminPage.getByTestId("admin-report-credits-events").locator("tbody tr"),
  ).toHaveCount(history.reportCredits.events.length);
});

test("re-read sends the failed report to the queue, takes it off the failed table and debits one credit of the owner", async () => {
  test.setTimeout(120_000);
  const before = await ownerCredits();
  const retried = adminPage.waitForResponse(
    (res) =>
      res.request().method() === "POST" &&
      new URL(res.url()).pathname === `/admin/reports/${failedReportId}/retry`,
  );
  await adminPage.getByTestId(`admin-retry-${failedReportId}`).click();
  expect((await retried).status()).toBe(204);
  await expect(adminPage.getByTestId(`admin-failed-${failedReportId}`)).toHaveCount(0);

  await expect.poll(() => reportStatus(failedReportId), { timeout: 90_000 }).toBe("done");
  expect(await ownerCredits()).toBe(before - 1);
});
