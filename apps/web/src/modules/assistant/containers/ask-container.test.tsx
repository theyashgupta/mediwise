/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { messages } from "@/config/messages";
import {
  fakeNetwork,
  me,
  never,
  problem,
  renderApp,
  resetApp,
  selfProfile,
} from "@/test/render-app";
import type { Question } from "../types";

/** Each test renders the whole app, and the first one loads its route, which can pass 5 s on a loaded 8 GB Mac. */
vi.setConfig({ testTimeout: 15_000 });

const reportId = "00000000-0000-4000-8000-0000000000c1";
const studyId = "00000000-0000-4000-8000-0000000000d1";
const member = {
  ...selfProfile,
  id: "00000000-0000-4000-8000-0000000000b2",
  name: "Ravi Rao",
  relation: "parent" as const,
  isSelf: false,
};
const meOn = {
  ...me,
  questionsLeft: 12,
  assistant: { enabled: true, outOfQuestions: null, reviewRequired: false, consented: false },
};

const chip = {
  kind: "value" as const,
  reportId,
  target: "ldl_cholesterol",
  label: "LDL cholesterol",
  labName: "Sunrise Diagnostics",
  date: "2026-08-04",
  deleted: false,
};

function question(id: string, overrides: Partial<Question>): Question {
  return {
    id,
    question: `Question ${id}`,
    focusReportId: null,
    createdAt: "2026-10-13T10:00:00.000Z",
    refusalKind: null,
    sentences: [],
    copy: null,
    flagged: false,
    ...overrides,
  };
}

const answered = question("2", {
  question: "Is my LDL going up?",
  sentences: [{ text: "Your LDL was 128 mg/dL on 4 Aug 2026.", cites: [chip] }],
});
const worry = question("1", {
  question: "Should I worry about my LDL?",
  refusalKind: "worry",
  sentences: [{ text: "Your LDL was 128 mg/dL on 4 Aug 2026.", cites: [chip] }],
  copy: "MediWise cannot tell you how serious this is. Ask your doctor about this result.",
});

const markerDetail = {
  report: {
    id: reportId,
    title: "Blood panel",
    labName: "Sunrise Diagnostics",
    collectedAt: "2026-08-04",
    createdAt: "2026-08-05T00:00:00.000Z",
  },
  marker: {
    markerKey: "ldl_cholesterol",
    name: "LDL cholesterol",
    value: 128,
    valueText: null,
    unit: "mg/dL",
    precision: 0,
    status: "watch",
    labRange: { low: null, high: 130 },
    calibratedRange: { low: null, high: 100 },
    labName: "Sunrise Diagnostics",
  },
};

const questionsPath = (id: string) => `GET /profiles/${id}/questions`;

function network(list: Question[], extra: Parameters<typeof fakeNetwork>[0] = {}) {
  return fakeNetwork({
    "GET /me": () => meOn,
    "GET /profiles": () => [selfProfile],
    [questionsPath(selfProfile.id)]: () => list,
    [questionsPath(member.id)]: () => [],
    [`GET /reports/${reportId}/markers/ldl_cholesterol`]: () => markerDetail,
    ...extra,
  });
}

afterEach(resetApp);

describe.each(["en", "hi"] as const)("the ask page in %s", (locale) => {
  const t = messages[locale];

  test("the chat shows the oldest question first, each sentence with its chips, and a refusal as a plain block after its facts", async () => {
    network([answered, worry]);
    await renderApp("/ask", { locale });

    const items = await screen.findAllByRole("article");
    expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
      `${t.assistant.you}: ${worry.question}`,
      `${t.assistant.you}: ${answered.question}`,
    ]);
    const [first] = items;
    const text = first!.textContent ?? "";
    expect(text.indexOf("128 mg/dL")).toBeLessThan(text.indexOf(worry.copy!));
    expect(
      within(first!).getAllByRole("button", { name: /LDL cholesterol · Sunrise Diagnostics/ }),
    ).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: t.assistant.titleFor(selfProfile.name) }),
    ).toBeTruthy();
  });

  test("a value chip opens the fact card in a bottom sheet with the value, both ranges, the status and the report link", async () => {
    network([answered]);
    await renderApp("/ask", { locale });

    await userEvent.click(await screen.findByRole("button", { name: /LDL cholesterol/ }));
    const sheet = await screen.findByRole("dialog");
    expect(within(sheet).getByText(t.assistant.fact.title)).toBeTruthy();
    expect(await within(sheet).findByText("128")).toBeTruthy();
    expect(within(sheet).getByText(t.common.status.watch)).toBeTruthy();
    expect(within(sheet).getByText(t.common.range.lab)).toBeTruthy();
    expect(within(sheet).getByText(t.common.range.calibrated)).toBeTruthy();
    expect(
      within(sheet).getByRole("link", { name: t.assistant.fact.open }).getAttribute("href"),
    ).toBe(`/reports/${reportId}/markers/ldl_cholesterol`);
  });

  test("a chip of a deleted report says so and opens nothing", async () => {
    network([
      question("3", {
        sentences: [
          {
            text: "Your first report is in MediWise.",
            cites: [{ ...chip, label: null, labName: null, date: null, deleted: true }],
          },
        ],
      }),
    ]);
    await renderApp("/ask", { locale });

    const deleted = await screen.findByText(t.assistant.chip.deleted);
    expect(deleted.closest("a, button")).toBeNull();
  });

  test("while the assistant is off the page says so and asks for no question", async () => {
    const requests = fakeNetwork({
      "GET /me": () => me,
      "GET /profiles": () => [selfProfile],
    });
    await renderApp("/ask", { locale });

    expect(await screen.findByText(t.assistant.off)).toBeTruthy();
    expect(requests.some(({ path }) => path.includes("/questions"))).toBe(false);
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  test("an empty chat shows the empty state and the input", async () => {
    network([]);
    await renderApp("/ask", { locale });

    expect(await screen.findByText(t.assistant.empty.title)).toBeTruthy();
    expect(screen.getByRole("textbox", { name: t.assistant.inputLabel })).toBeTruthy();
    expect(screen.getByText(t.assistant.onlyReports)).toBeTruthy();
  });
});

test("study and finding chips open the report page at that section", async () => {
  network([
    question("4", {
      sentences: [
        {
          text: "Your ultrasound of 4 Aug 2026 is in your reports.",
          cites: [
            { ...chip, kind: "study", target: studyId, label: "ultrasound, Abdomen" },
            { ...chip, kind: "finding", target: studyId, label: "HbA1c is in the watch range" },
          ],
        },
      ],
    }),
  ]);
  await renderApp("/ask");

  const study = await screen.findByRole(
    "link",
    { name: /ultrasound, Abdomen/ },
    { timeout: 10_000 },
  );
  expect(study.getAttribute("href")).toBe(`/reports/${reportId}#study-${studyId}`);
  expect(
    screen.getByRole("link", { name: /HbA1c is in the watch range/ }).getAttribute("href"),
  ).toBe(`/reports/${reportId}#findings`);
});

test("at 1280 px and wider the fact card fills the right column", async () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query === "(width >= 80rem)",
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
  network([answered]);
  await renderApp("/ask");

  const column = await screen.findByRole("complementary", {
    name: messages.en.assistant.fact.title,
  });
  expect(within(column).getByText(messages.en.assistant.fact.hint)).toBeTruthy();
  await userEvent.click(await screen.findByRole("button", { name: /LDL cholesterol/ }));
  expect(await within(column).findByText("128")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  vi.restoreAllMocks();
});

test("a question goes out with the open report, and its answer joins the end of the chat", async () => {
  const reply = question("9", {
    question: "What was my LDL?",
    sentences: [{ text: "Your LDL was 128 mg/dL on 4 Aug 2026.", cites: [chip] }],
  });
  const requests = network([answered], {
    [`POST /profiles/${selfProfile.id}/questions`]: () => reply,
  });
  await renderApp(`/ask?report=${reportId}`);

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await userEvent.type(input, "What was my LDL?{Enter}");

  expect(await screen.findByText("What was my LDL?", { selector: "article p" })).toBeTruthy();
  const posted = requests.find(({ method }) => method === "POST");
  expect(posted?.body).toEqual({ question: "What was my LDL?", reportId });
  const items = screen.getAllByRole("article");
  expect(within(items.at(-1)!).getByText("What was my LDL?")).toBeTruthy();
  expect((input as HTMLTextAreaElement).value).toBe("");
  expect(document.activeElement).toBe(input);
  await waitFor(() =>
    expect(requests.filter(({ path }) => path === "/me").length).toBeGreaterThan(1),
  );
});

test("a double click on Send and two Enter presses send one question", async () => {
  const requests = network([], { [`POST /profiles/${selfProfile.id}/questions`]: never });
  await renderApp("/ask");

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await userEvent.type(input, "How many mg?");
  const send = screen.getByTestId("assistant-send");
  fireEvent.click(send);
  fireEvent.click(send);
  fireEvent.keyDown(input, { key: "Enter" });
  fireEvent.keyDown(input, { key: "Enter" });

  await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(true));
  expect(requests.filter(({ method }) => method === "POST")).toHaveLength(1);
});

test("a refused question shows the problem title, stays out of the chat and keeps the typed text", async () => {
  network([], {
    [`POST /profiles/${selfProfile.id}/questions`]: () =>
      problem(429, "You can ask 30 questions in one day. Try again tomorrow."),
  });
  await renderApp("/ask");

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await userEvent.type(input, "One more?{Enter}");

  expect(
    await screen.findByText("You can ask 30 questions in one day. Try again tomorrow."),
  ).toBeTruthy();
  expect(screen.queryByRole("article")).toBeNull();
  expect((input as HTMLTextAreaElement).value).toBe("One more?");
});

test("a suggested question from the address fills the input and sends nothing", async () => {
  const requests = network([]);
  await renderApp(`/ask?report=${reportId}&q=${encodeURIComponent("How has my LDL changed?")}`);

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await waitFor(() => expect((input as HTMLTextAreaElement).value).toBe("How has my LDL changed?"));
  expect(requests.some(({ method }) => method === "POST")).toBe(false);
});

test("switching profile drops the open report and shows the other profile's chat", async () => {
  const requests = network([answered], { "GET /profiles": () => [selfProfile, member] });
  await renderApp(`/ask?report=${reportId}`);
  expect(await screen.findByText(answered.question)).toBeTruthy();

  const [trigger] = screen.getAllByRole("button", { name: /Asha Rao/ });
  await userEvent.click(trigger!);
  await userEvent.click(await screen.findByRole("menuitemradio", { name: /Ravi Rao/ }));

  expect(
    await screen.findByRole("heading", { name: messages.en.assistant.titleFor("Ravi Rao") }),
  ).toBeTruthy();
  await waitFor(() => expect(window.location.search).toBe(""));
  expect(screen.queryByText(answered.question)).toBeNull();
  expect(requests.some(({ path }) => path === `/profiles/${member.id}/questions`)).toBe(true);
});

describe.each(["en", "hi"] as const)("questions left and actions in %s", (locale) => {
  const t = messages[locale].assistant;

  test("the header counts the questions left at 5 or fewer and says nothing at 6", async () => {
    fakeNetwork({
      "GET /me": () => ({ ...meOn, questionsLeft: 5 }),
      "GET /profiles": () => [selfProfile],
      [questionsPath(selfProfile.id)]: () => [answered],
    });
    await renderApp("/ask", { locale });
    expect(await screen.findByText(t.left(5))).toBeTruthy();
    resetApp();

    fakeNetwork({
      "GET /me": () => ({ ...meOn, questionsLeft: 6 }),
      "GET /profiles": () => [selfProfile],
      [questionsPath(selfProfile.id)]: () => [answered],
    });
    await renderApp("/ask", { locale });
    expect(await screen.findByText(answered.question)).toBeTruthy();
    expect(screen.queryByText(t.left(6))).toBeNull();
  });

  test("at 0 questions with a free credit one tap on Use 1 credit buys 20 questions once", async () => {
    let bought = false;
    const requests = fakeNetwork({
      "GET /me": () =>
        bought
          ? { ...meOn, credits: 1, questionsLeft: 20 }
          : {
              ...meOn,
              questionsLeft: 0,
              assistant: { enabled: true, outOfQuestions: "use_credit" },
            },
      "GET /profiles": () => [selfProfile],
      [questionsPath(selfProfile.id)]: () => [answered],
      "POST /me/question-packs": async () => {
        bought = true;
        return { credits: 1, questionsLeft: 20 };
      },
    });
    await renderApp("/ask", { locale });

    expect(await screen.findByText(t.out.use_credit)).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: t.inputLabel }) as HTMLTextAreaElement).disabled,
    ).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: t.out.useCredit }));

    await waitFor(() => expect(screen.queryByText(t.out.use_credit)).toBeNull());
    expect(requests.filter(({ method }) => method === "POST")).toHaveLength(1);
    expect(
      (screen.getByRole("textbox", { name: t.inputLabel }) as HTMLTextAreaElement).disabled,
    ).toBe(false);
  });

  test("at 0 questions with no free credit the block links to buying credits or adding a report, never the button", async () => {
    fakeNetwork({
      "GET /me": () => ({
        ...meOn,
        questionsLeft: 0,
        assistant: { enabled: true, outOfQuestions: "buy" },
      }),
      "GET /profiles": () => [selfProfile],
      [questionsPath(selfProfile.id)]: () => [],
    });
    await renderApp("/ask", { locale });
    expect(await screen.findByText(t.out.buy)).toBeTruthy();
    expect(screen.getByRole("link", { name: t.out.buyCredits }).getAttribute("href")).toBe(
      "/credits",
    );
    expect(screen.queryByRole("button", { name: t.out.useCredit })).toBeNull();
    resetApp();

    fakeNetwork({
      "GET /me": () => ({
        ...meOn,
        questionsLeft: 0,
        assistant: { enabled: true, outOfQuestions: "add_report" },
      }),
      "GET /profiles": () => [selfProfile],
      [questionsPath(selfProfile.id)]: () => [],
    });
    await renderApp("/ask", { locale });
    expect(await screen.findByText(t.out.add_report)).toBeTruthy();
    expect(screen.getByRole("link", { name: t.out.addReport }).getAttribute("href")).toBe(
      "/reports/upload",
    );
  });

  test("This answer is wrong sends one flag and shows the marked state", async () => {
    const requests = network([answered], {
      [`POST /questions/${answered.id}/flag`]: () => ({ ...answered, flagged: true }),
    });
    await renderApp("/ask", { locale });

    await userEvent.click(await screen.findByRole("button", { name: t.wrong }));
    expect(await screen.findByText(t.markedWrong)).toBeTruthy();
    expect(screen.queryByRole("button", { name: t.wrong })).toBeNull();
    expect(requests.filter(({ path }) => path.endsWith("/flag"))).toHaveLength(1);
  });

  test("Clear chat asks first, cancel keeps the chat, and confirm empties it", async () => {
    const requests = network([answered], {
      [`DELETE /profiles/${selfProfile.id}/questions`]: () => new Response(null, { status: 204 }),
    });
    await renderApp("/ask", { locale });
    await screen.findByText(answered.question);

    await userEvent.click(screen.getByRole("button", { name: t.menu.label }));
    await userEvent.click(await screen.findByRole("menuitem", { name: t.menu.clear }));
    await userEvent.click(await screen.findByRole("button", { name: t.clearDialog.cancel }));
    expect(requests.some(({ method }) => method === "DELETE")).toBe(false);
    expect(screen.getByText(answered.question)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: t.menu.label }));
    await userEvent.click(await screen.findByRole("menuitem", { name: t.menu.clear }));
    await userEvent.click(await screen.findByRole("button", { name: t.clearDialog.confirm }));
    expect(await screen.findByText(t.empty.title)).toBeTruthy();
    expect(requests.filter(({ method }) => method === "DELETE")).toHaveLength(1);
  });
});

test("the Hindi interface says once that answers are in English, and the English one does not", async () => {
  network([answered]);
  await renderApp("/ask", { locale: "hi" });
  expect(await screen.findAllByText(messages.hi.assistant.englishOnly)).toHaveLength(1);
  resetApp();

  network([answered]);
  await renderApp("/ask");
  await screen.findByText(answered.question);
  expect(screen.queryByText(messages.en.assistant.englishOnly)).toBeNull();
  expect(screen.queryByText(messages.hi.assistant.englishOnly)).toBeNull();
});

test("Clear chat is off on an empty chat", async () => {
  network([]);
  await renderApp("/ask");
  await screen.findByText(messages.en.assistant.empty.title);
  await userEvent.click(screen.getByRole("button", { name: messages.en.assistant.menu.label }));
  const item = await screen.findByRole("menuitem", { name: messages.en.assistant.menu.clear });
  expect(item.getAttribute("aria-disabled")).toBe("true");
});

test("the out-of-questions copy is the API copy of docs/research/assistant.md, word for word", () => {
  expect(messages.en.assistant.out).toMatchObject({
    use_credit: "You have no questions left. Use 1 credit to get 20 more questions.",
    buy: "You have no questions left. Buy credits to ask more questions.",
    add_report: "You have no questions left. Add a report to get 5 more questions.",
  });
});

test("a 402 on a question refreshes questions left and shows the next step", async () => {
  let spent = false;
  network([answered], {
    "GET /me": () =>
      spent
        ? { ...meOn, questionsLeft: 0, assistant: { enabled: true, outOfQuestions: "use_credit" } }
        : meOn,
    [`POST /profiles/${selfProfile.id}/questions`]: () => {
      spent = true;
      return problem(402, messages.en.assistant.out.use_credit);
    },
  });
  await renderApp("/ask");

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await userEvent.type(input, "One more?{Enter}");

  expect(
    await screen.findByRole("button", { name: messages.en.assistant.out.useCredit }),
  ).toBeTruthy();
});

test("a chip of a deleted episode says the episode is deleted", async () => {
  network([
    question("5", {
      sentences: [
        {
          text: "Your workup has two reports.",
          cites: [
            {
              kind: "episode",
              reportId: null,
              target: studyId,
              label: null,
              labName: null,
              date: null,
              deleted: true,
            },
          ],
        },
      ],
    }),
  ]);
  await renderApp("/ask");
  expect(await screen.findByText(messages.en.assistant.chip.episodeDeleted)).toBeTruthy();
});

test("an open report that is not a uuid is dropped, and a question over 500 characters is cut to 500", async () => {
  const requests = network([], {
    [`POST /profiles/${selfProfile.id}/questions`]: () => answered,
  });
  await renderApp(`/ask?report=not-a-report&q=${"a".repeat(600)}`);

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await waitFor(() => expect((input as HTMLTextAreaElement).value).toHaveLength(500));
  await userEvent.click(screen.getByRole("button", { name: messages.en.assistant.send }));

  await waitFor(() =>
    expect(requests.find(({ method }) => method === "POST")?.body).toEqual({
      question: "a".repeat(500),
    }),
  );
});

describe.each(["en", "hi"] as const)("the review month in %s", (locale) => {
  const t = messages[locale].assistant;
  const reviewMe = (consented: boolean) => ({
    ...meOn,
    assistant: { enabled: true, outOfQuestions: null, reviewRequired: true, consented },
  });

  test("the page asks for consent first, and one tick stores it and opens the input", async () => {
    let consented = false;
    const requests = network([], {
      "GET /me": () => reviewMe(consented),
      "POST /me/consents": () => {
        consented = true;
        return new Response(null, { status: 204 });
      },
    });
    await renderApp("/ask", { locale });

    const input = await screen.findByRole("textbox", { name: t.inputLabel });
    expect(screen.getByText(t.consent)).toBeTruthy();
    expect((input as HTMLTextAreaElement).disabled).toBe(true);

    await userEvent.dblClick(screen.getByRole("checkbox", { name: t.consent }));

    await waitFor(() => expect(screen.queryByText(t.consent)).toBeNull());
    expect((input as HTMLTextAreaElement).disabled).toBe(false);
    expect(requests.filter(({ path }) => path === "/me/consents")).toHaveLength(1);
  });

  test("a failed consent shows its title and leaves the box unticked and the input off", async () => {
    network([], {
      "GET /me": () => reviewMe(false),
      "POST /me/consents": () => problem(404, "Not Found"),
    });
    await renderApp("/ask", { locale });

    await userEvent.click(await screen.findByRole("checkbox", { name: t.consent }));

    expect(await screen.findByText("Not Found")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: t.consent }).getAttribute("aria-checked")).toBe(
      "false",
    );
    expect(
      (screen.getByRole("textbox", { name: t.inputLabel }) as HTMLTextAreaElement).disabled,
    ).toBe(true);
  });
});

test("no consent shows when the review month is off or the account already agreed", async () => {
  network([answered]);
  await renderApp("/ask");
  await screen.findByText(answered.question);
  expect(screen.queryByText(messages.en.assistant.consent)).toBeNull();
  resetApp();

  network([answered], {
    "GET /me": () => ({
      ...meOn,
      assistant: { enabled: true, outOfQuestions: null, reviewRequired: true, consented: true },
    }),
  });
  await renderApp("/ask");
  await screen.findByText(answered.question);
  expect(screen.queryByText(messages.en.assistant.consent)).toBeNull();
});

test("a question of only invisible characters shows the empty-question copy and sends nothing", async () => {
  const requests = network([]);
  await renderApp("/ask");

  const input = await screen.findByRole("textbox", { name: messages.en.assistant.inputLabel });
  await userEvent.type(input, "\u200B\u200B  {Enter}");

  expect(await screen.findByText(messages.en.assistant.emptyQuestion)).toBeTruthy();
  expect(requests.some(({ method }) => method === "POST")).toBe(false);
});
