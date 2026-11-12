import type { Payload } from "payload";
import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { createTestPayload } from "../testing";

const dispatchUrl = "https://api.github.com/repos/theyashgupta/mediwise/dispatches";
let payload: Payload;
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  payload = await createTestPayload();
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.stubEnv("GITHUB_DISPATCH_TOKEN", "test-token");
  fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await vi.runOnlyPendingTimersAsync();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

let counter = 0;
const createPage = (status: "draft" | "published", context?: Record<string, unknown>) =>
  payload.create({
    collection: "pages",
    data: { slug: `page-${++counter}`, title: "Title", _status: status },
    draft: status === "draft",
    context,
  });

const settle = () => vi.advanceTimersByTimeAsync(5_000);

test("a publish sends one cms-published dispatch with the token after 5 s", async () => {
  await createPage("published");
  await vi.advanceTimersByTimeAsync(4_900);
  expect(fetchMock).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(100);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe(dispatchUrl);
  expect(init.method).toBe("POST");
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
  expect(JSON.parse(init.body as string)).toEqual({ event_type: "cms-published" });
});

test("three publishes inside 5 s send one dispatch", async () => {
  await createPage("published");
  await vi.advanceTimersByTimeAsync(2_000);
  await createPage("published");
  await vi.advanceTimersByTimeAsync(2_000);
  await createPage("published");
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("a draft save sends no dispatch, also over a published document", async () => {
  const page = await createPage("published");
  await settle();
  fetchMock.mockClear();
  await createPage("draft");
  await payload.update({
    collection: "pages",
    id: page.id,
    draft: true,
    data: { title: "Draft title" },
  });
  await settle();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("an unpublish sends one dispatch", async () => {
  const page = await createPage("published");
  await settle();
  fetchMock.mockClear();
  await payload.update({ collection: "pages", id: page.id, data: { _status: "draft" } });
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("deleting a published document sends one dispatch, deleting a draft sends none", async () => {
  const published = await createPage("published");
  const draft = await createPage("draft");
  await settle();
  fetchMock.mockClear();
  await payload.delete({ collection: "pages", id: draft.id });
  await settle();
  expect(fetchMock).not.toHaveBeenCalled();
  await payload.delete({ collection: "pages", id: published.id });
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("an empty token sends no dispatch", async () => {
  vi.stubEnv("GITHUB_DISPATCH_TOKEN", "");
  await createPage("published");
  await settle();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("context.skipDispatch sends no dispatch", async () => {
  await createPage("published", { skipDispatch: true });
  await settle();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("a publish on faq also sends a dispatch", async () => {
  await payload.create({
    collection: "faq",
    data: { key: `k-${++counter}`, question: "Q?", order: 1, _status: "published" },
  });
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("a failed dispatch does not fail the save", async () => {
  fetchMock.mockRejectedValueOnce(new Error("network down"));
  const page = await createPage("published");
  await settle();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect((await payload.findByID({ collection: "pages", id: page.id })).title).toBe("Title");
});
