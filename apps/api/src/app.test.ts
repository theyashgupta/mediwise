import { expect, test, vi } from "vitest";
import { app } from "./app.js";

vi.mock("./modules/profiles/profiles.repo.js", () => ({
  insertSelfProfileIfMissing: async () => {},
}));

vi.mock("./modules/me/me.repo.js", () => ({ findSelfName: async () => undefined }));
vi.mock("./modules/credits/credits.repo.js", () => ({ findBalance: async () => 0 }));

test("the health module is mounted at /health", async () => {
  expect((await app.request("/health")).status).toBe(200);
});

test("an unknown path returns a 404 problem", async () => {
  const res = await app.request("/nope");
  expect(res.status).toBe(404);
  expect(res.headers.get("Content-Type")).toBe("application/problem+json");
  expect(await res.json()).toEqual({ type: "about:blank", title: "Not Found", status: 404 });
});

test("GET /me runs as the dev user under NODE_ENV=test", async () => {
  const res = await app.request("/me");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    userId: "dev-user",
    email: "dev-user@example.com",
    name: "dev-user",
    credits: 0,
  });
});

test("every response carries security headers and a request id", async () => {
  const res = await app.request("/health");
  expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(res.headers.get("X-Request-Id")).toBeTruthy();
});

test("log lines written during a request start with its request id", async () => {
  const lines: unknown[][] = [];
  const spy = vi.spyOn(console, "log").mockImplementation((...args) => lines.push(args));
  await app.request("/health", { headers: { "X-Request-Id": "req-abc" } });
  spy.mockRestore();
  expect(lines.length).toBeGreaterThan(0);
  expect(lines.every((args) => args[0] === "[req-abc]")).toBe(true);
});

test("a body over 100 KB returns a 413 problem", async () => {
  const res = await app.request("/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "x".repeat(101 * 1024) }),
  });
  expect(res.status).toBe(413);
  expect(res.headers.get("Content-Type")).toBe("application/problem+json");
});

test("the 11th report created in one hour returns a 429 problem", async () => {
  const post = () =>
    app.request("/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  for (let i = 0; i < 10; i++) expect((await post()).status).toBe(400);
  const res = await post();
  expect(res.status).toBe(429);
  expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(3500);
  expect((await app.request("/reports/x/retry", { method: "POST" })).status).not.toBe(429);
});

test.each(["https://app.mediwise.theyashgupta.me", "https://mediwise.pages.dev"])(
  "CORS allows the listed origin %s",
  async (origin) => {
    const res = await app.request("/health", { headers: { Origin: origin } });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(origin);
  },
);

test("CORS gives no allow header to an origin outside the list", async () => {
  const res = await app.request("/health", {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example.com", "Access-Control-Request-Method": "GET" },
  });
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});
