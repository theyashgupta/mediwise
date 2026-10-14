import { beforeEach, expect, test, vi } from "vitest";

const edge = vi.hoisted(() => ({
  pages: [] as { users: { id: string; email?: string }[] }[],
  error: null as Error | null,
  grants: [] as { userId: string; delta: number; note: string }[],
}));

vi.mock("../../lib/supabase.js", () => ({
  supabase: {
    auth: {
      admin: {
        listUsers: async ({ page }: { page: number }) => ({
          data: edge.pages[page - 1] ?? { users: [] },
          error: edge.error,
        }),
      },
    },
  },
}));
vi.mock("./credits.repo.js", () => ({
  insertGrant: async (userId: string, delta: number, note: string) => {
    edge.grants.push({ userId, delta, note });
  },
}));

const { findUserIdByEmail, grantCredits } = await import("./credits.service.js");

/** Makes a full page of 1000 accounts, so the lookup asks for the next page. */
function fullPage(prefix: string) {
  return {
    users: Array.from({ length: 1000 }, (_, i) => ({
      id: `${prefix}-${i}`,
      email: `${prefix}${i}@example.com`,
    })),
  };
}

beforeEach(() => {
  edge.pages = [];
  edge.error = null;
  edge.grants = [];
});

test("a grant finds the account on a later page by its email in any case and adds the credits", async () => {
  edge.pages = [fullPage("a"), { users: [{ id: "user-1", email: "Arjun.Demo@example.com" }] }];

  expect(await grantCredits("  arjun.demo@EXAMPLE.com ", 3, "beta tester")).toBe("user-1");
  expect(edge.grants).toEqual([{ userId: "user-1", delta: 3, note: "beta tester" }]);
});

test("an email that no account has fails after the last page", async () => {
  edge.pages = [fullPage("a"), { users: [{ id: "user-1" }] }];

  await expect(findUserIdByEmail("nobody@example.com")).rejects.toThrow(
    "No account has the email nobody@example.com",
  );
});

test("a Supabase error stops the lookup", async () => {
  edge.error = new Error("service unavailable");

  await expect(findUserIdByEmail("arjun.demo@example.com")).rejects.toThrow("service unavailable");
});
