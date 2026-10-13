import type { Session } from "@supabase/supabase-js";
import { beforeEach, expect, test, vi } from "vitest";

const auth = vi.hoisted(() => ({
  session: null as Session | null,
  updates: [] as unknown[],
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: auth.session } }),
      updateUser: async (attributes: unknown) => {
        auth.updates.push(attributes);
        return { data: {}, error: null };
      },
    },
  },
}));

const sessionWith = (metadata: Record<string, unknown>) =>
  ({ user: { user_metadata: metadata } }) as unknown as Session;

/**
 * Loads a fresh copy of the locale store over the given stored value, as a page load does.
 */
async function load(stored?: string) {
  const storage = new Map<string, string>(stored ? [["locale", stored]] : []);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  vi.stubGlobal("document", { documentElement: { lang: "en" } });
  vi.resetModules();
  return { store: await import("./use-locale"), storage };
}

beforeEach(() => {
  auth.session = null;
  auth.updates = [];
});

test("a new visitor gets English", async () => {
  const { store } = await load();
  expect(store.getLocale()).toBe("en");
  expect(store.getT().shell.nav.home).toBe("Home");
});

test("a switch to Hindi persists across a reload and sets the lang attribute", async () => {
  const { store, storage } = await load();
  await store.setLocale("hi");
  expect(document.documentElement.lang).toBe("hi");
  expect(store.getT().shell.nav.home).toBe("होम");

  const reloaded = await load(storage.get("locale"));
  expect(reloaded.store.getLocale()).toBe("hi");
});

test("a stored value that is not a locale falls back to English", async () => {
  const { store } = await load("fr");
  expect(store.getLocale()).toBe("en");
});

test("a signed-in switch saves the locale to the account", async () => {
  auth.session = sessionWith({});
  const { store } = await load();
  await store.setLocale("hi");
  expect(auth.updates).toEqual([{ data: { locale: "hi" } }]);
});

test("at sign-in the account locale wins over the device", async () => {
  const { store } = await load("en");
  await store.syncLocale(sessionWith({ locale: "hi" }));
  expect(store.getLocale()).toBe("hi");
  expect(auth.updates).toEqual([]);
});

test("at sign-in an account without a locale takes the device choice", async () => {
  const { store } = await load("hi");
  await store.syncLocale(sessionWith({}));
  expect(store.getLocale()).toBe("hi");
  expect(auth.updates).toEqual([{ data: { locale: "hi" } }]);
});
