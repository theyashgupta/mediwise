/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { fakeNetwork, me, problem, renderApp, resetApp, selfProfile } from "@/test/render-app";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

afterEach(resetApp);

const failedId = "6f1c2b9e-1d2a-4c3b-9e8f-0a1b2c3d4e5f";
const userA = "a1b2c3d4-0000-4000-8000-000000000001";
const userB = "b2c3d4e5-0000-4000-8000-000000000002";
const total = (kind: string, events: number, credits: number, amountPaise = 0) => ({
  kind,
  events,
  credits,
  amountPaise,
});
const event = (
  id: string,
  userId: string,
  kind: string,
  credits: number | null,
  amountPaise: number | null = null,
) => ({
  id,
  at: "2026-10-14T05:00:00.000Z",
  userId,
  profiles: 2,
  kind,
  credits,
  amountPaise,
});
const history = {
  reportCredits: {
    totals: [
      total("grant", 1, 3),
      total("purchase", 2, 25, 79800),
      total("upload", 4, -4),
      total("refund", 1, 1),
      total("purchase_refund", 0, 0),
    ],
    events: [event("e1", userA, "purchase", 5, 19900), event("e2", userB, "upload", -1)],
  },
  questionPacks: {
    totals: [total("questions", 1, -1), total("question", 7, 0)],
    events: [event("e3", userA, "question", null), event("e4", userA, "questions", -1)],
  },
  eventLimit: 200,
};
const failed = [{ id: failedId, createdAt: "2026-10-14T05:00:00.000Z", errorClass: "upstream" }];

const shell = { "GET /me": () => me, "GET /profiles": () => [selfProfile] };
const admin = {
  ...shell,
  "GET /admin/credits": () => history,
  "GET /admin/failed-reports": () => failed,
};
const main = () => screen.getByRole("main");

test("a user who is not the admin gets not found on /admin", async () => {
  fakeNetwork({
    ...shell,
    "GET /admin/credits": () => problem(404, "Not Found"),
    "GET /admin/failed-reports": () => problem(404, "Not Found"),
  });
  await renderApp("/admin");

  expect(await screen.findByText("Not Found")).toBeTruthy();
  expect(screen.queryByText("Operator")).toBeNull();
});

test("the admin sees report credits and question packs apart, every amount in rupees and no dollar", async () => {
  fakeNetwork(admin);
  await renderApp("/admin");

  expect(await screen.findByRole("heading", { name: "Operator" })).toBeTruthy();
  expect(within(main()).getByRole("heading", { name: "Report credits" })).toBeTruthy();
  expect(within(main()).getByRole("heading", { name: "Question packs" })).toBeTruthy();
  const value = (testId: string) => within(main()).getByTestId(testId).textContent;
  expect(value("admin-total-upload")).toBe("4");
  expect(value("admin-total-detail-purchase")).toBe("25 credits · ₹798");
  expect(value("admin-total-question")).toBe("7");
  const reportEvents = within(main()).getByTestId("admin-report-credits-events");
  expect(within(reportEvents).getByText("₹199")).toBeTruthy();
  expect(within(reportEvents).getByText("+5")).toBeTruthy();
  expect(within(reportEvents).getByText("Report credit used")).toBeTruthy();
  const packEvents = within(main()).getByTestId("admin-question-packs-events");
  expect(within(packEvents).getByText("Question used")).toBeTruthy();
  expect(within(main()).getByText("Upstream or network error")).toBeTruthy();
  expect(main().textContent).not.toContain("$");
  expect(within(main()).queryByText(/Claude spend|cost per read/i)).toBeNull();
  expect(within(main()).queryByText(selfProfile.name)).toBeNull();
});

test("the date filters and a click on a user ask for that range and that user", async () => {
  const requests = fakeNetwork(admin);
  await renderApp("/admin");

  fireEvent.change(await screen.findByLabelText("From"), { target: { value: "2026-10-01" } });
  fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-10-14" } });
  await userEvent.click(within(main()).getAllByTitle(userB)[0]!);

  await waitFor(() =>
    expect(requests.map((r) => r.path)).toContain(
      `/admin/credits?from=2026-10-01&to=2026-10-14&userId=${userB}`,
    ),
  );
  await userEvent.click(screen.getByTestId("admin-user-filter"));
  await waitFor(() =>
    expect(requests.at(-1)?.path).toBe("/admin/credits?from=2026-10-01&to=2026-10-14"),
  );
});

test("re-read on a failed report calls the admin retry and loads the failed reads again", async () => {
  const requests = fakeNetwork({
    ...admin,
    [`POST /admin/reports/${failedId}/retry`]: () => new Response(null, { status: 204 }),
  });
  await renderApp("/admin");

  await userEvent.click(await screen.findByTestId(`admin-retry-${failedId}`));

  expect(await screen.findByText("The report is in the queue again.")).toBeTruthy();
  expect(requests.filter((r) => r.path === `/admin/reports/${failedId}/retry`)).toHaveLength(1);
  expect(requests.filter((r) => r.path === "/admin/failed-reports").length).toBeGreaterThan(1);
});
