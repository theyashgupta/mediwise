import { Hono } from "hono";
import { expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { suggestionsRoutes } from "./suggestions.routes.js";

const profileId = "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10";
const disclaimer = "MediWise is for information. Ask your doctor before you act on this.";

const store = vi.hoisted(() => {
  const owned = (owner: string, id: string) =>
    owner === "alice" && id === "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10";
  const row = (
    markerKey: string,
    value: number,
    status: string,
    low: number | null,
    high: number | null,
    unit: string,
  ) => ({
    reportId: "report-1",
    date: "2026-03-01",
    markerKey,
    value,
    valueText: null,
    unit,
    status,
    calibratedLow: low,
    calibratedHigh: high,
  });
  return {
    create: vi.fn(),
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owned(owner, id) ? { id, isSelf: true } : undefined,
    },
    repo: {
      listMarkerHistory: async (owner: string, id: string) =>
        owned(owner, id)
          ? [
              row("ldl_cholesterol", 140, "watch", null, 99, "mg/dL"),
              row("potassium", 6.8, "risk", 3.5, 5, "mmol/L"),
            ]
          : [],
      listAlertFindings: async (owner: string, id: string) =>
        owned(owner, id)
          ? [
              {
                reportId: "report-1",
                date: "2026-03-01",
                kind: "study_alert" as const,
                title: 'Your ultrasound report says: "Suspicious mass, malignancy not excluded."',
                citedKeys: [],
                citedStudyIds: ["study-1"],
              },
            ]
          : [],
    },
  };
});

vi.mock("../dashboard/dashboard.repo.js", () => store.repo);
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../findings/findings.repo.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../findings/findings.repo.js")>()),
  findVisit: async () => undefined,
}));
vi.mock("../../lib/anthropic.js", () => ({ anthropic: { messages: { create: store.create } } }));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/profiles", suggestionsRoutes);
app.onError(handleError);

const get = (headers: Record<string, string> = {}, id = profileId) =>
  app.request(`/profiles/${id}/suggestions`, { headers });

test("the owner gets ranked suggestions from every done report, each with the disclaimer", async () => {
  const res = await get();
  expect(res.status).toBe(200);
  const { suggestions } = (await res.json()) as {
    suggestions: { kind: string; markerKeys: string[]; rank: number; disclaimer: string }[];
  };
  expect(suggestions.map(({ kind, markerKeys }) => [kind, ...markerKeys].join(":"))).toEqual([
    "doctor_now",
    "doctor_now:potassium",
    "habit:ldl_cholesterol",
  ]);
  expect(suggestions.map(({ rank }) => rank)).toEqual([1, 2, 3]);
  expect(suggestions.every((suggestion) => suggestion.disclaimer === disclaimer)).toBe(true);
});

test("another user's profile answers 404 with no suggestion in the body", async () => {
  const res = await get({ "x-user": "mallory" });
  expect(res.status).toBe(404);
  expect(await res.text()).not.toContain("suggestions");
});

test("an id that is not a uuid answers 400", async () => {
  expect((await get({}, "not-a-uuid")).status).toBe(400);
});

test("Accept-Language hi answers in Hindi", async () => {
  const { suggestions } = (await (await get({ "accept-language": "hi" })).json()) as {
    suggestions: { disclaimer: string }[];
  };
  expect(suggestions[0]?.disclaimer).toBe(
    "MediWise सिर्फ़ जानकारी के लिए है। इस पर कुछ भी करने से पहले अपने डॉक्टर से पूछें।",
  );
});

test("the response carries an ETag, is private and varies by language", async () => {
  const res = await get();
  expect(res.headers.get("etag")).toBeTruthy();
  expect(res.headers.get("cache-control")).toBe("private, no-cache");
  expect(res.headers.get("vary")).toContain("Accept-Language");
});

test("the same report set answers 304 to its own ETag", async () => {
  const tag = (await get()).headers.get("etag")!;
  expect((await get({ "if-none-match": tag })).status).toBe(304);
});

test("a Hindi request with the English ETag gets the Hindi body, not a 304", async () => {
  const tag = (await get()).headers.get("etag")!;
  expect((await get({ "if-none-match": tag, "accept-language": "hi" })).status).toBe(200);
});

test("the alert title never repeats the printed report line", async () => {
  const body = await (await get()).text();
  expect(body).toContain("Ask your doctor about a line in your ultrasound report.");
  expect(body).not.toMatch(/malignancy|Suspicious/);
});

test("no request makes a Claude call", async () => {
  await get();
  await get({ "accept-language": "hi" });
  await get({ "x-user": "mallory" });
  expect(store.create).not.toHaveBeenCalled();
});
