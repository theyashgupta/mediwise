import { expect, test } from "@playwright/test";
import { shellOrigin } from "../local-env";

const email = `e2e-offline-${Date.now()}@example.com`;
const password = "e2e-Password-1";

test.use({ baseURL: shellOrigin, serviceWorkers: "allow" });

test("the built app is installable, and after one visit its shell opens offline with no API data in Cache Storage", async ({
  page,
  context,
}) => {
  await page.goto("/signup");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill(password);
  await page.getByTestId("auth-consent-terms").check();
  await page.getByTestId("auth-consent-health_data").check();
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("user-menu")).toBeVisible();
  await page.evaluate("navigator.serviceWorker.ready.then(() => true)");
  await page.reload();
  await expect(page.getByTestId("user-menu")).toBeVisible();

  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = await cdp.send("Page.getInstallabilityErrors");
  expect(installabilityErrors, "Chrome can install the app").toEqual([]);

  const cached = await page.evaluate<string[]>(`(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      const requests = await (await caches.open(name)).keys();
      urls.push(...requests.map((request) => request.url));
    }
    return urls;
  })()`);
  expect(cached).toContain(`${shellOrigin}/`);
  for (const url of cached) {
    expect(new URL(url).origin, url).toBe(shellOrigin);
    expect(new URL(url).pathname, url).toMatch(
      /^\/($|assets\/|site\.webmanifest$|robots\.txt$|sitemap\.xml$)/,
    );
  }

  await context.setOffline(true);
  await page.close();
  const app = await context.newPage();
  const offline = await app.goto("/");
  expect(offline?.fromServiceWorker()).toBe(true);
  await expect(app.getByTestId("shell-offline")).toBeVisible();
  await expect(app.getByTestId("user-menu")).toBeVisible();

  await context.setOffline(false);
  await expect(app.getByTestId("shell-offline")).toBeHidden();
});
