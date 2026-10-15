/** @vitest-environment jsdom */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import { queryClient } from "@/config/query-client";
import { fakeNetwork, me, never, renderApp, resetApp, selfProfile } from "@/test/render-app";
import type { Question } from "../types";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

const t = messages.en.assistant;
const meOn = {
  ...me,
  questionsLeft: 12,
  assistant: { enabled: true, outOfQuestions: null, reviewRequired: false, consented: false },
};
const reply: Question = {
  id: "9",
  question: "What was my LDL?",
  focusReportId: null,
  createdAt: "2026-10-13T10:00:00.000Z",
  refusalKind: null,
  sentences: [{ text: "Your LDL was 128 mg/dL on 4 Aug 2026.", cites: [] }],
  copy: null,
  flagged: false,
};

function network(extra: Parameters<typeof fakeNetwork>[0] = {}) {
  return fakeNetwork({
    "GET /me": () => meOn,
    "GET /profiles": () => [selfProfile],
    "GET /dashboard": never,
    "GET /dashboard/family": never,
    [`GET /profiles/${selfProfile.id}/questions`]: () => [],
    ...extra,
  });
}

const mascotIn = (element: HTMLElement) => element.querySelector("svg[data-state]");

afterEach(resetApp);

describe.each(["en", "hi"] as const)("the chat launcher in %s", (locale) => {
  const text = messages[locale].assistant;

  test("a page shows the labelled launcher, and a tap opens the chat with focus in the input", async () => {
    const requests = network();
    await renderApp("/", { locale });

    const launcher = await screen.findByRole("button", { name: text.widget.open });
    expect(mascotIn(launcher)?.getAttribute("data-state")).toBe("idle");
    expect(requests.some(({ path }) => path.includes("/questions"))).toBe(false);

    await userEvent.click(launcher);
    const panel = await screen.findByRole("dialog", { name: text.titleFor(selfProfile.name) });
    const input = await within(panel).findByRole("textbox", { name: text.inputLabel });
    expect(document.activeElement).toBe(input);
    expect(within(panel).getByRole("log", { name: text.widget.thread })).toBeTruthy();
    expect(await within(panel).findByText(text.empty.title)).toBeTruthy();
  });
});

test("Escape and the close button close the chat and give focus back to the launcher", async () => {
  network();
  await renderApp("/");
  const launcher = await screen.findByRole("button", { name: t.widget.open });

  await userEvent.click(launcher);
  await screen.findByRole("textbox", { name: t.inputLabel });
  await userEvent.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(document.activeElement).toBe(launcher);

  await userEvent.click(launcher);
  await userEvent.click(await screen.findByRole("button", { name: t.widget.close }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("while the assistant is off no page shows the launcher", async () => {
  fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /dashboard": never,
    "GET /dashboard/family": never,
  });
  await renderApp("/");
  await waitFor(() => expect(queryClient.getQueryData(["me"])).toEqual(me));
  expect(screen.queryByTestId("ask-launcher")).toBeNull();
});

test("the full Ask page shows no launcher", async () => {
  network();
  await renderApp("/ask");
  await screen.findByRole("textbox", { name: t.inputLabel });
  expect(screen.queryByTestId("ask-launcher")).toBeNull();
});

test("the mascot listens while the user types, thinks while the question runs, talks when the answer comes, then rests", async () => {
  let answer: (value: Question) => void = () => undefined;
  network({
    [`POST /profiles/${selfProfile.id}/questions`]: () =>
      new Promise<Question>((resolve) => {
        answer = resolve;
      }),
  });
  await renderApp("/");
  await userEvent.click(await screen.findByRole("button", { name: t.widget.open }));
  const panel = await screen.findByRole("dialog");
  const input = await within(panel).findByRole("textbox", { name: t.inputLabel });
  expect(mascotIn(panel)?.getAttribute("data-state")).toBe("idle");

  await userEvent.type(input, "What was my LDL?");
  expect(mascotIn(panel)?.getAttribute("data-state")).toBe("listening");

  await userEvent.keyboard("{Enter}");
  await waitFor(() => expect(mascotIn(panel)?.getAttribute("data-state")).toBe("thinking"));
  expect(within(panel).getByRole("status").textContent).toBe(t.writing);

  answer(reply);
  expect(await within(panel).findByText(reply.sentences[0]!.text)).toBeTruthy();
  expect(mascotIn(panel)?.getAttribute("data-state")).toBe("talking");
  await waitFor(() => expect(mascotIn(panel)?.getAttribute("data-state")).toBe("idle"), {
    timeout: 4000,
  });
});
