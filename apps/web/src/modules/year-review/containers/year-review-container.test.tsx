/** @vitest-environment jsdom */
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { InferResponseType } from "hono/client";
import { afterEach, describe, expect, test } from "vitest";
import { messages } from "@/config/messages";
import type { api } from "@/lib/api";
import { fakeNetwork, never, problem, renderApp, resetApp, selfProfile } from "@/test/render-app";

type YearReview = InferResponseType<(typeof api.profiles)[":id"]["year-review"]["$get"], 200>;

const member = {
  ...selfProfile,
  id: "00000000-0000-4000-8000-0000000000b2",
  name: "Ravi Rao",
  relation: "parent" as const,
  isSelf: false,
};

const review: YearReview = {
  from: "2025-11-02",
  to: "2026-09-20",
  reportCount: 3,
  labCount: 2,
  score: { from: 71, to: 78 },
  intro: ["This review covers 3 reports from 2 labs.", "Your score went from 71 to 78."],
  moved: [
    {
      markerKey: "vitamin_d",
      name: "Vitamin D",
      unit: "ng/mL",
      precision: 1,
      direction: "improved",
      from: { value: 14.2, status: "risk", date: "2025-11-02" },
      to: { value: 34.5, status: "optimal", date: "2026-09-20" },
    },
  ],
  stillAtRisk: [],
  measuredOnce: [
    {
      markerKey: "tsh",
      name: "TSH",
      unit: "µIU/mL",
      precision: 2,
      value: 2.1,
      status: "optimal",
      date: "2026-09-20",
    },
  ],
};

const reviewPath = (id: string) => `GET /profiles/${id}/year-review`;

afterEach(resetApp);

describe.each(["en", "hi"] as const)("year in review in %s", (locale) => {
  const t = messages[locale];

  test("the page shows a loading state while the review loads", async () => {
    fakeNetwork({
      "GET /profiles": () => [selfProfile],
      [reviewPath(selfProfile.id)]: never,
    });
    await renderApp("/year-review", { locale });

    const main = await screen.findByRole("main");
    expect(await within(main).findByRole("status")).toBeTruthy();
    expect(within(main).getByText(t.common.loading)).toBeTruthy();
  });

  test("a profile with fewer than two reports in a year sees the empty state and an upload link", async () => {
    fakeNetwork({
      "GET /profiles": () => [selfProfile],
      [reviewPath(selfProfile.id)]: () => problem(404, "Not found"),
    });
    await renderApp("/year-review", { locale });

    expect(await screen.findByRole("heading", { name: t.yearReview.page.emptyTitle })).toBeTruthy();
    expect(screen.getByText(t.yearReview.page.emptyBody)).toBeTruthy();
    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("link", { name: t.yearReview.page.upload }).getAttribute("href"),
    ).toBe("/reports/upload");
  });

  test("the review shows the intro, the score change and every marker group", async () => {
    fakeNetwork({
      "GET /profiles": () => [selfProfile],
      [reviewPath(selfProfile.id)]: () => review,
    });
    await renderApp("/year-review", { locale });

    expect(await screen.findByText(review.intro.join(" "))).toBeTruthy();
    expect(screen.getByText("71 → 78")).toBeTruthy();
    expect(screen.getByRole("button", { name: t.yearReview.page.print })).toBeTruthy();

    const moved = screen.getByRole("region", { name: t.yearReview.moved.title });
    expect(within(moved).getByRole("link", { name: "Vitamin D" }).getAttribute("href")).toBe(
      "/trends/vitamin_d",
    );
    expect(within(moved).getByText(t.yearReview.direction.improved)).toBeTruthy();

    const risk = screen.getByRole("region", { name: t.yearReview.risk.title });
    expect(within(risk).getByText(t.yearReview.risk.empty)).toBeTruthy();

    const once = screen.getByRole("region", { name: t.yearReview.once.title });
    expect(within(once).getByRole("link", { name: "TSH" })).toBeTruthy();
  });

  test("a failed load shows the error, and retry loads the review", async () => {
    let failing = true;
    fakeNetwork({
      "GET /profiles": () => [selfProfile],
      [reviewPath(selfProfile.id)]: () => (failing ? problem(500) : review),
    });
    await renderApp("/year-review", { locale });

    const alert = await screen.findByRole("alert");
    expect(within(alert).getByText(t.yearReview.page.loadError)).toBeTruthy();

    failing = false;
    await userEvent.click(within(alert).getByRole("button", { name: t.common.retry }));

    expect(await screen.findByText(review.intro.join(" "))).toBeTruthy();
    expect(screen.queryByText(t.yearReview.page.loadError)).toBeNull();
  });
});

test("the profileId in the address picks the review of that family member", async () => {
  const requests = fakeNetwork({
    "GET /profiles": () => [selfProfile, member],
    [reviewPath(member.id)]: () => review,
  });
  await renderApp(`/year-review?profileId=${member.id}`);

  expect(await screen.findByText(review.intro.join(" "))).toBeTruthy();
  expect(screen.getByText(/^Ravi Rao · /)).toBeTruthy();
  expect(requests.map((r) => r.path)).not.toContain(`/profiles/${selfProfile.id}/year-review`);
});
