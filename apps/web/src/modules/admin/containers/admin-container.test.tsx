/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { fakeNetwork, me, problem, renderApp, resetApp, selfProfile } from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

afterEach(resetApp);

const failedId = "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const days = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 8, 15 + index)).toISOString().slice(0, 10),
  reads: index === 29 ? 2 : 0,
  costCents: index === 29 ? 4.5 : 0,
}));
const overview = {
  spend: {
    todayCents: 5.5,
    weekCents: 5.5,
    monthCents: 1650,
    capCents: 2000,
    hardStop: false,
    reads: 3,
    questions: 1,
    purchases: 2,
    revenuePaise: 19800,
  },
  days,
  meanCostPerReadCents: 2.25,
  failed: [{ id: failedId, createdAt: "2026-10-14T05:00:00.000Z", errorClass: "upstream" }],
  queue: { depth: 2, oldestQueuedMs: 45 * 60_000 },
  credits: { granted: 5, purchased: 10, spentOnReads: 2, spentOnQuestions: 2 },
  people: { profiles: 3, users: 3, activeProfiles: 2, activeUsers: 2 },
  alerts: ["spend", "queue"],
};

const shell = { "GET /me": () => me, "GET /profiles": () => [selfProfile] };
const main = () => screen.getByRole("main");

test("a user who is not the admin gets not found on /admin", async () => {
  fakeNetwork({ ...shell, "GET /admin/overview": () => problem(404, "Not Found") });
  await renderApp("/admin");

  expect(await screen.findByText("Not Found")).toBeTruthy();
  expect(screen.queryByText("Operator")).toBeNull();
});

test("the admin sees spend, reads, queue, credits, profiles, failed reads and both alerts", async () => {
  fakeNetwork({ ...shell, "GET /admin/overview": () => overview });
  await renderApp("/admin");

  expect(await screen.findByRole("heading", { name: "Operator" })).toBeTruthy();
  const value = (testId: string) => within(main()).getByTestId(testId).textContent;
  expect(value("admin-spend-today")).toBe("$0.055");
  expect(value("admin-spend-month")).toBe("$16.50");
  expect(value("admin-questions-month")).toBe("1");
  expect(value("admin-queue-depth")).toBe("2");
  expect(value("admin-queue-oldest")).toBe("45 min");
  expect(value("admin-credits-reads")).toBe("2");
  expect(value("admin-active-users")).toBe("2");
  expect(within(main()).getByText("Mean cost per read in 30 days: $0.0225.")).toBeTruthy();
  const alerts = within(main()).getByTestId("admin-alerts");
  expect(within(alerts).getByText(/at 83% of the monthly cap/)).toBeTruthy();
  expect(within(alerts).getByText(/in the queue for 45 min/)).toBeTruthy();
  expect(within(main()).getByText("Upstream or network error")).toBeTruthy();
  expect(within(main()).queryByText(selfProfile.name)).toBeNull();
});

test("re-read on a failed report calls the admin retry and loads the numbers again", async () => {
  const requests = fakeNetwork({
    ...shell,
    "GET /admin/overview": () => overview,
    [`POST /admin/reports/${failedId}/retry`]: () => new Response(null, { status: 204 }),
  });
  await renderApp("/admin");

  await userEvent.click(await screen.findByTestId(`admin-retry-${failedId}`));

  expect(await screen.findByText("The report is in the queue again.")).toBeTruthy();
  expect(requests.filter((r) => r.path === `/admin/reports/${failedId}/retry`)).toHaveLength(1);
  expect(requests.filter((r) => r.path === "/admin/overview").length).toBeGreaterThan(1);
});
