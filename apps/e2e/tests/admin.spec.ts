import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { adminUserId, apiEnv, apiPort, webEnv } from "../local-env";

const sample = new URL("../../api/fixtures/golden/sample-2025.pdf", import.meta.url);
const adminEmail = "arjun.demo@example.com";
const ownerEmail = `e2e-admin-owner-${Date.now()}@example.com`;
const password = "e2e-Password-1";
const profileName = "Dense History";
const authUrl = `${apiEnv.SUPABASE_URL}/auth/v1`;
const seededJobKinds = "('e2e_spend', 'e2e_stale')";
const adminRoutes = [
  ["GET", "/admin/overview"],
  ["GET", "/admin/spend"],
  ["POST", "/admin/reports/00000000-0000-4000-8000-000000000000/retry"],
] as const;

type Overview = {
  spend: {
    todayCents: number;
    weekCents: number;
    monthCents: number;
    capCents: number;
    reads: number;
    questions: number;
    purchases: number;
    revenuePaise: number;
  };
  days: { date: string; reads: number; costCents: number }[];
  meanCostPerReadCents: number | null;
  failed: { id: string; errorClass: string }[];
  queue: { depth: number; oldestQueuedMs: number | null };
  credits: { granted: number; purchased: number; spentOnReads: number; spentOnQuestions: number };
  people: { profiles: number; users: number; activeProfiles: number; activeUsers: number };
  alerts: string[];
};

let adminPage: Page;
let ownerPage: Page;
let ownerToken: string;
let failedReportId: string;
let overview: Overview;

test.describe.configure({ mode: "serial" });

/**
 * Runs SQL on the e2e database with the API's own Postgres client.
 *
 * @remarks
 * The dense fixture holds only done reports, so the spend, the stale job and the failed read need a few rows of their own.
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
  sql(`delete from jobs where kind in ${seededJobKinds}`);
  await adminPage.close();
  await ownerPage.close();
});

test("without a session the three admin routes return 401", async () => {
  for (const [method, path] of adminRoutes) {
    expect((await callApi(method, path)).status, `${method} ${path}`).toBe(401);
  }
});

test("a user who is not the admin gets Not Found on /admin with no breadcrumb or link, and 404 from the admin routes", async () => {
  await ownerPage.goto("/signup");
  await ownerPage.getByTestId("auth-email").fill(ownerEmail);
  await ownerPage.getByTestId("auth-password").fill(password);
  await ownerPage.getByTestId("auth-submit").click();
  await expect(ownerPage.getByTestId("user-menu")).toBeVisible();
  ownerToken = await accessToken(ownerEmail);

  await ownerPage.goto("/admin");
  await expect(ownerPage.getByText("Not Found")).toBeVisible();
  await expect(ownerPage.getByRole("heading", { name: "Operator" })).toHaveCount(0);
  await expect(ownerPage.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(0);
  await expect(ownerPage.locator('a[href="/admin"]')).toHaveCount(0);
  for (const [method, path] of adminRoutes) {
    expect((await callApi(method, path, ownerToken)).status, `${method} ${path}`).toBe(404);
  }
});

test("the owner gets the dense history, one failed read, and the month gets 90 percent of the cap and a stale job", async () => {
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
    delete from jobs where kind in ${seededJobKinds};
  `);
  expect(await ownerCredits()).toBe(1);

  const adminToken = await accessToken(adminEmail);
  const spend = (await (await callApi("GET", "/admin/spend", adminToken)).json()) as {
    costCents: number;
    capCents: number;
  };
  const missingCents = Math.max(0, spend.capCents * 0.9 - spend.costCents);
  sql(`
    insert into jobs (kind, payload, status, input_tokens, output_tokens)
      values ('e2e_spend', '{}', 'failed', ${Math.ceil(missingCents * 5000)}, 0);
    insert into jobs (kind, payload, run_after, created_at)
      values ('e2e_stale', '{}', now() + interval '1 day', now() - interval '45 minutes');
  `);
});

test("the admin sees spend, reads, queue, credits, profiles and failed reads as GET /admin/overview returns them", async () => {
  await signIn(adminPage, adminEmail);
  const loaded = adminPage.waitForResponse(
    (res) =>
      res.request().method() === "GET" &&
      new URL(res.url()).port === String(apiPort) &&
      new URL(res.url()).pathname === "/admin/overview",
  );
  await adminPage.goto("/admin");
  overview = (await (await loaded).json()) as Overview;
  await expect(adminPage.getByRole("heading", { name: "Operator" })).toBeVisible();

  const expected = await adminPage.evaluate(({ spend, queue, credits, people, ...rest }) => {
    const usd = (cents: number) =>
      (cents / 100).toLocaleString("en-IN", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: cents < 100 ? 4 : 2,
      });
    const count = (value: number) => value.toLocaleString("en-IN");
    const minutes = Math.floor((queue.oldestQueuedMs ?? 0) / 60_000);
    return {
      values: {
        "admin-spend-today": usd(spend.todayCents),
        "admin-spend-week": usd(spend.weekCents),
        "admin-spend-month": usd(spend.monthCents),
        "admin-reads-month": count(spend.reads),
        "admin-questions-month": count(spend.questions),
        "admin-purchases-month": `${count(spend.purchases)} · ${(spend.revenuePaise / 100).toLocaleString("en-IN", { style: "currency", currency: "INR" })}`,
        "admin-queue-depth": count(queue.depth),
        "admin-queue-oldest":
          minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`,
        "admin-credits-granted": count(credits.granted),
        "admin-credits-purchased": count(credits.purchased),
        "admin-credits-reads": count(credits.spentOnReads),
        "admin-credits-questions": count(credits.spentOnQuestions),
        "admin-profiles": count(people.profiles),
        "admin-users": count(people.users),
        "admin-active-profiles": count(people.activeProfiles),
        "admin-active-users": count(people.activeUsers),
      },
      chart: rest.days
        .filter((day) => day.reads > 0)
        .map(
          (day) =>
            `${count(day.reads)} ${day.reads === 1 ? "read" : "reads"}, ${usd(day.costCents)}`,
        ),
      mean: rest.meanCostPerReadCents === null ? null : usd(rest.meanCostPerReadCents),
    };
  }, overview);

  for (const [testId, text] of Object.entries(expected.values)) {
    await expect(adminPage.getByTestId(testId), testId).toHaveText(text);
  }
  expect(overview.spend.reads).toBeGreaterThan(0);
  expect(expected.chart.length).toBeGreaterThan(0);
  const chartLabel = await adminPage.getByTestId("admin-reads-chart").getAttribute("aria-label");
  for (const day of expected.chart) expect(chartLabel).toContain(day);
  await expect(
    adminPage.getByText(`Mean cost per read in 30 days: ${expected.mean}.`),
  ).toBeVisible();

  expect(overview.failed.find((report) => report.id === failedReportId)?.errorClass).toBe(
    "no_credits",
  );
  await expect(adminPage.locator('[data-testid^="admin-failed-"]')).toHaveCount(
    overview.failed.length,
  );
  await expect(adminPage.getByTestId(`admin-failed-${failedReportId}`)).toContainText(
    "No credits left",
  );
});

test("the spend line shows at 80 percent of the cap and the queue line shows for a job older than 30 minutes", async () => {
  const share = Math.round((overview.spend.monthCents / overview.spend.capCents) * 100);
  expect(share).toBeGreaterThanOrEqual(80);
  expect(overview.queue.oldestQueuedMs).toBeGreaterThan(30 * 60_000);
  expect(overview.alerts).toEqual(["spend", "queue"]);

  await expect(adminPage.getByTestId("admin-alert-spend")).toContainText(
    `Claude spend is at ${share}% of the monthly cap`,
  );
  await expect(adminPage.getByTestId("admin-alert-queue")).toContainText(
    `A job is in the queue for ${await adminPage.getByTestId("admin-queue-oldest").textContent()}`,
  );
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
