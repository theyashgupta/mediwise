/** @vitest-environment jsdom */
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { messages } from "@/config/messages";
import { fakeNetwork, me, renderApp, resetApp, selfProfile } from "@/test/render-app";

const member = {
  ...selfProfile,
  id: "00000000-0000-4000-8000-0000000000b2",
  name: "Ravi Rao",
  relation: "parent" as const,
  isSelf: false,
};

const report = {
  id: "00000000-0000-4000-8000-0000000000c1",
  profileId: "00000000-0000-4000-8000-0000000000b2",
  status: "done",
  error: null,
  createdAt: "2026-10-13T20:41:52.055Z",
  header: {
    title: "Blood panel",
    titleEdited: false,
    labName: "Made-up Labs B",
    collectedAt: "2026-08-04",
    reportedAt: null,
    markerCount: 2,
    score: null,
    tier: null,
    coverage: {
      measured: 2,
      core: 16,
      pct: null,
    },
    capped: true,
    formula:
      "A marker in its optimal range scores 100. A marker in watch scores 60. A marker in risk scores 20. A core marker counts two times. Your score is the weighted mean of these points. When the report has fewer than half of the core markers, the highest score is 70. When the report has fewer than a quarter of the core markers, the highest score is 50.",
  },
  verdict: null,
  note: null,
  moveFirst: [],
  categories: [],
  derived: [],
  unmapped: [],
  followUps: [],
  unmeasured: [],
  patterns: [],
  doctorQuestions: [],
  narrative: null,
  findings: [],
  settled: [],
  studies: [],
  labs: ["Made-up Labs B"],
  files: {
    otherDocuments: [],
    images: [],
    duplicates: [],
    identityRemoved: false,
  },
  links: [],
};
const meOn = { ...me, questionsLeft: 12, assistant: { enabled: true, outOfQuestions: null } };

function network(assistantMe: object) {
  return fakeNetwork({
    "GET /me": () => assistantMe,
    "GET /profiles": () => [selfProfile, member],
    [`GET /reports/${report.id}`]: () => report,
    "GET /reports": () => ({ items: [], nextCursor: null }),
    [`GET /profiles/${member.id}/questions`]: () => [],
  });
}

afterEach(resetApp);

describe.each(["en", "hi"] as const)("the report header in %s", (locale) => {
  const t = messages[locale].assistant;

  test("a done report offers Ask about this report while the assistant is on", async () => {
    network(meOn);
    await renderApp(`/reports/${report.id}`, { locale });

    const link = await screen.findByRole("link", { name: t.askReport });
    expect(link.getAttribute("href")).toBe(`/ask?report=${report.id}`);
  });

  test("the header has no ask link while the assistant is off", async () => {
    network(me);
    await renderApp(`/reports/${report.id}`, { locale });

    expect(await screen.findByRole("link", { name: messages[locale].report.compare })).toBeTruthy();
    expect(screen.queryByRole("link", { name: t.askReport })).toBeNull();
  });
});

test("asking about a family member's report switches to that profile and opens its chat", async () => {
  const requests = network(meOn);
  await renderApp(`/reports/${report.id}`);

  await userEvent.click(
    await screen.findByRole("link", { name: messages.en.assistant.askReport }, { timeout: 10_000 }),
  );

  expect(
    await screen.findByRole(
      "heading",
      { name: messages.en.assistant.titleFor("Ravi Rao") },
      { timeout: 10_000 },
    ),
  ).toBeTruthy();
  await waitFor(() =>
    expect(requests.some(({ path }) => path === `/profiles/${member.id}/questions`)).toBe(true),
  );
  expect(requests.some(({ path }) => path === `/profiles/${selfProfile.id}/questions`)).toBe(false);
});
