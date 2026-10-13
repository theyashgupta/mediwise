import { expect, test } from "@playwright/test";

test("a landing link with ?lang=hi opens the sign-in page in Hindi and drops the parameter", async ({
  page,
}) => {
  await page.goto("/login?lang=hi");
  await expect(page.getByRole("heading", { name: "साइन इन करें" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "hi");
  expect(new URL(page.url()).search).toBe("");
  expect(await page.evaluate(() => localStorage.getItem("locale"))).toBe("hi");

  await page.reload();
  await expect(page.getByRole("heading", { name: "साइन इन करें" })).toBeVisible();
});
