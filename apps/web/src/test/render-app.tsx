import { RouterProvider } from "@tanstack/react-router";
import { act, cleanup, configure, render } from "@testing-library/react";
import type { InferResponseType } from "hono/client";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { vi } from "vitest";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { setLocale } from "@/common/hooks/use-locale";
import type { Locale } from "@/config/messages";
import { queryClient } from "@/config/query-client";
import type { api } from "@/lib/api";

export type SentRequest = { method: string; path: string; body: unknown };

type Reply = Response | object | null;

type Handler = (request: SentRequest) => Reply | Promise<Reply>;

const userId = "00000000-0000-4000-8000-000000000001";
const email = "asha@example.com";

export const selfProfile: InferResponseType<typeof api.profiles.$get, 200>[number] = {
  id: "00000000-0000-4000-8000-0000000000a1",
  name: "Asha Rao",
  relation: "self",
  dateOfBirth: "1986-04-12",
  dateOfBirthApproximate: false,
  sex: "female",
  ancestry: "south_asian",
  isSelf: true,
  permissionConfirmedAt: null,
  guardianConfirmedAt: null,
  reportCount: 3,
  valueCount: 72,
};

export const me: InferResponseType<typeof api.me.$get, 200> = {
  userId,
  email,
  name: selfProfile.name,
  credits: 2,
  questionsLeft: 0,
  assistant: { enabled: false, outOfQuestions: null, reviewRequired: false, consented: false },
};

/**
 * jsdom lacks the layout and pointer APIs that Radix Select and sonner call.
 *
 * @remarks
 * These are browser stand-ins, not fakes of app code. Each one does nothing, as a headless browser would.
 */
function polyfillBrowser() {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
  window.scrollTo = () => undefined;
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }) as unknown as MediaQueryList;
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

polyfillBrowser();
queryClient.setDefaultOptions({ queries: { retry: false } });
configure({ asyncUtilTimeout: 3000 });

/** A problem response as the API sends it. */
export function problem(status: number, title = "Request failed") {
  return Response.json(
    { title },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

/** A request that never answers, so the page stays in its loading state. */
export const never = () => new Promise<Reply>(() => undefined);

/**
 * Replaces `fetch` with a fake network keyed by `"<METHOD> <path>"`, and records every request it gets.
 *
 * @remarks
 * Both the Hono client and Supabase call the global `fetch` at request time, so this is the one edge the app has.
 * A request with no handler fails like a dropped connection, so no test reaches a real server.
 */
export function fakeNetwork(handlers: Record<string, Handler>) {
  const requests: SentRequest[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
    const request = { method, path: url.pathname + url.search, body };
    requests.push(request);
    const handler = handlers[`${method} ${url.pathname}`];
    if (!handler) throw new TypeError(`Failed to fetch ${method} ${url.pathname}`);
    const reply = await handler(request);
    return reply instanceof Response ? reply : Response.json(reply);
  });
  return requests;
}

/**
 * Stores a Supabase session the way the client does after sign-in, so no auth call is needed.
 */
function storeSession(locale: Locale) {
  localStorage.setItem(
    "sb-localhost-auth-token",
    JSON.stringify({
      access_token: "test-access-token",
      refresh_token: "test-refresh-token",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email,
        app_metadata: { provider: "email" },
        user_metadata: { locale },
        identities: [],
        created_at: "2026-10-01T00:00:00Z",
      },
    }),
  );
}

/**
 * Renders the whole app at a path, signed in, in one locale.
 *
 * @remarks
 * It uses the app's own router, providers and query client, the same tree `main.tsx` renders.
 * The router loads a location only while a `RouterProvider` is mounted, so it navigates after the render.
 */
export async function renderApp(path: string, { locale = "en" }: { locale?: Locale } = {}) {
  storeSession(locale);
  await setLocale(locale);
  const view = render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  await act(() => router.navigate({ href: path, replace: true }));
  return view;
}

/** Renders one container inside the app providers, for a page that has no route. */
export async function renderInApp(ui: ReactNode, { locale = "en" }: { locale?: Locale } = {}) {
  await setLocale(locale);
  return render(<Providers>{ui}</Providers>);
}

/**
 * Unmounts the page and forgets the session, the cache, storage, toasts and the fake network.
 *
 * @remarks
 * Sonner keeps toasts in a module store, so a toast would otherwise show again in the next test.
 */
export function resetApp() {
  toast.getToasts().forEach(({ id }) => toast.dismiss(id));
  cleanup();
  queryClient.clear();
  localStorage.clear();
  vi.unstubAllGlobals();
}
