import { afterEach, expect, test, vi } from "vitest";
import { api } from "./api";

const auth = vi.hoisted(() => ({
  session: null as { access_token: string } | null,
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: auth.session } }),
      signOut: auth.signOut,
    },
  },
}));

function stubFetch(status: number) {
  const calls: Headers[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(new Headers(init?.headers));
      return new Response("{}", { status, headers: { "Content-Type": "application/json" } });
    }),
  );
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
  auth.session = null;
  auth.signOut.mockClear();
});

test("api client targets the local API by default", () => {
  expect(api.health.$url().href).toBe("http://localhost:3001/health");
});

test("api client exposes GET /me", () => {
  expect(api.me.$url().href).toBe("http://localhost:3001/me");
});

test("api client sends the access token of the current session", async () => {
  auth.session = { access_token: "token-1" };
  const calls = stubFetch(200);
  await api.me.$get();
  expect(calls[0]?.get("Authorization")).toBe("Bearer token-1");
});

test("a 401 answer signs the user out", async () => {
  stubFetch(401);
  await api.me.$get();
  expect(auth.signOut).toHaveBeenCalledOnce();
});

test("a 200 answer keeps the user signed in", async () => {
  stubFetch(200);
  await api.me.$get();
  expect(auth.signOut).not.toHaveBeenCalled();
});
