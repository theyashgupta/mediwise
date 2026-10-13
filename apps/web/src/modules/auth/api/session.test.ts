import type { ParsedLocation } from "@tanstack/react-router";
import { beforeEach, expect, test, vi } from "vitest";
import { finishOAuth, requireSession } from "./session";

const auth = vi.hoisted(() => ({ session: null as object | null }));

vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: auth.session } }) } },
}));

beforeEach(() => {
  auth.session = null;
  vi.stubGlobal("window", { location: { origin: "http://localhost:5173" } });
});

function at(href: string) {
  return { location: { href } as ParsedLocation };
}

async function redirectOf(guard: Promise<unknown>) {
  const thrown = await guard.then(
    () => undefined,
    (error: unknown) => error,
  );
  return (thrown as { options: object }).options;
}

test("the callback sends a signed-in user to the page they came from", async () => {
  auth.session = { access_token: "t" };
  expect(await redirectOf(finishOAuth(at("/auth/callback?next=%2Freports%2Fr1")))).toMatchObject({
    href: "/reports/r1",
  });
});

test("the callback sends a signed-in user without a target to the dashboard", async () => {
  auth.session = { access_token: "t" };
  expect(await redirectOf(finishOAuth(at("/auth/callback")))).toMatchObject({ href: "/" });
});

test("a cancelled Google sign-in returns to the sign-in page with the error", async () => {
  expect(
    await redirectOf(finishOAuth(at("/auth/callback?error=access_denied&next=%2F"))),
  ).toMatchObject({ to: "/login", search: { error: "access_denied" } });
});

test("a callback without a session returns to the sign-in page with a failure", async () => {
  expect(await redirectOf(finishOAuth(at("/auth/callback?code=stale")))).toMatchObject({
    to: "/login",
    search: { error: "oauth_failed" },
  });
});

test("a visitor without a session goes to sign in with the page they asked for", async () => {
  expect(await redirectOf(requireSession(at("/trends?range=1y")))).toMatchObject({
    to: "/login",
    search: { next: "/trends?range=1y" },
  });
  expect(await redirectOf(requireSession(at("/")))).toMatchObject({ to: "/login", search: {} });
});

test("offline, a visitor without a session stays in the shell and its offline state", async () => {
  vi.stubGlobal("navigator", { onLine: false });
  await expect(requireSession(at("/reports"))).resolves.toBeUndefined();
  vi.unstubAllGlobals();
});
