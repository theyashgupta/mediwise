import { Hono } from "hono";
import { createHash } from "node:crypto";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { meRoutes } from "./me.routes.js";

const store = vi.hoisted(() => {
  const state = {
    names: new Map<string, string>(),
    paths: new Map<string, string[]>(),
    removeCalls: [] as string[][],
    deletedUsers: [] as string[],
    deletionLog: [] as { userIdHash: string; files: number }[],
  };
  return {
    state,
    profilesRepo: {
      insertSelfProfileIfMissing: async (owner: string, name: string) => {
        if (!state.names.has(owner)) state.names.set(owner, name);
      },
    },
    repo: {
      findSelfName: async (owner: string) => state.names.get(owner),
      updateSelfName: async (owner: string, name: string) => {
        state.names.set(owner, name);
        return name;
      },
      listStoragePathsByOwner: async (owner: string) => state.paths.get(owner) ?? [],
      deleteAllByOwner: async (owner: string, log: { userIdHash: string; files: number }) => {
        state.deletionLog.push(log);
        state.names.delete(owner);
        state.paths.delete(owner);
      },
      exportByOwner: async (owner: string) => ({
        profiles: [{ name: state.names.get(owner) }],
        reports: [],
        markers: [],
      }),
    },
    storage: {
      remove: async (paths: string[]) => {
        state.removeCalls.push(paths);
      },
    },
    supabase: {
      auth: {
        admin: {
          deleteUser: async (id: string): Promise<{ error: Error | null }> => {
            state.deletedUsers.push(id);
            return { error: null };
          },
        },
      },
    },
  };
});

vi.mock("./me.repo.js", () => store.repo);
vi.mock("../credits/credits.repo.js", () => ({ findBalance: async () => 3 }));
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../../lib/storage.js", () => store.storage);
vi.mock("../../lib/supabase.js", () => ({ supabase: store.supabase }));

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    c.set("email", `${c.var.userId}@example.com`);
    c.set("name", c.req.header("x-name"));
    await next();
  })
  .route("/me", meRoutes);
app.onError(handleError);

function call(method: string, path: string, body?: object, user = "alice", name?: string) {
  return app.request(path, {
    method,
    headers: {
      "x-user": user,
      "Content-Type": "application/json",
      ...(name && { "x-name": name }),
    },
    body: body && JSON.stringify(body),
  });
}

beforeEach(() => {
  store.state.names.clear();
  store.state.paths.clear();
  store.state.removeCalls.length = 0;
  store.state.deletedUsers.length = 0;
  store.state.deletionLog.length = 0;
});

test("GET /me returns the email, the self profile name, defaulting to the email name, and the credit balance", async () => {
  expect(await (await call("GET", "/me")).json()).toEqual({
    userId: "alice",
    email: "alice@example.com",
    name: "alice",
    credits: 3,
  });
});

test("a first Google sign-in creates the self profile with the Google name", async () => {
  const res = await call("GET", "/me", undefined, "gina", "Gina Rao");
  expect(await res.json()).toMatchObject({ email: "gina@example.com", name: "Gina Rao" });
});

test("a Google sign-in keeps the name of an existing self profile", async () => {
  await call("PATCH", "/me", { name: "Alice" });
  const res = await call("GET", "/me", undefined, "alice", "Alice From Google");
  expect(await res.json()).toMatchObject({ name: "Alice" });
});

test("PATCH /me changes the name that GET /me returns", async () => {
  const res = await call("PATCH", "/me", { name: "  Alice Rao " });
  expect(await res.json()).toEqual({
    userId: "alice",
    email: "alice@example.com",
    name: "Alice Rao",
  });
  expect(await (await call("GET", "/me")).json()).toMatchObject({ name: "Alice Rao" });
});

test("PATCH /me rejects an empty name", async () => {
  expect((await call("PATCH", "/me", { name: " " })).status).toBe(400);
});

test("DELETE /me without the typed confirm returns 400 and deletes nothing", async () => {
  await call("GET", "/me");
  store.state.paths.set("alice", ["alice/r1/0.pdf"]);
  for (const body of [undefined, {}, { confirm: "delete" }]) {
    expect((await call("DELETE", "/me", body)).status).toBe(400);
  }
  expect(store.state.removeCalls).toEqual([]);
  expect(store.state.names.has("alice")).toBe(true);
  expect(store.state.deletionLog).toEqual([]);
});

test("DELETE /me removes every stored file in batches of 1000, then the rows, then the sign-in", async () => {
  await call("GET", "/me");
  await call("GET", "/me", undefined, "bob");
  const paths = Array.from({ length: 2001 }, (_, i) => `alice/r/${i}.jpg`);
  store.state.paths.set("alice", paths);
  const res = await call("DELETE", "/me", { confirm: "DELETE" });
  expect(res.status).toBe(204);
  expect(store.state.removeCalls.map((batch) => batch.length)).toEqual([1000, 1000, 1]);
  expect(store.state.removeCalls.flat()).toEqual(paths);
  expect(store.state.names.has("alice")).toBe(false);
  expect(store.state.names.has("bob")).toBe(true);
  expect(store.state.deletedUsers).toEqual(["alice"]);
});

test("DELETE /me logs the deletion with a hash of the user id and the file count, never the id", async () => {
  await call("GET", "/me");
  store.state.paths.set("alice", ["alice/r1/0.pdf", "alice/r1/1.jpg"]);
  expect((await call("DELETE", "/me", { confirm: "DELETE" })).status).toBe(204);
  expect(store.state.deletionLog).toEqual([
    { userIdHash: createHash("sha256").update("alice").digest("hex"), files: 2 },
  ]);
  expect(JSON.stringify(store.state.deletionLog)).not.toContain("alice");
});

test("DELETE /me keeps the rows when removing the files fails", async () => {
  await call("GET", "/me");
  store.state.paths.set("alice", ["alice/r1/0.pdf"]);
  const remove = vi.spyOn(store.storage, "remove").mockRejectedValueOnce(new Error("storage down"));
  expect((await call("DELETE", "/me", { confirm: "DELETE" })).status).toBe(500);
  expect(store.state.names.has("alice")).toBe(true);
  expect(store.state.deletedUsers).toEqual([]);
  expect(store.state.deletionLog).toEqual([]);
  remove.mockRestore();
});

test("DELETE /me answers a problem when Supabase keeps the sign-in", async () => {
  await call("GET", "/me");
  const deleteUser = vi
    .spyOn(store.supabase.auth.admin, "deleteUser")
    .mockResolvedValueOnce({ error: new Error("auth down") });
  const res = await call("DELETE", "/me", { confirm: "DELETE" });
  expect(res.status).toBe(502);
  expect(store.state.names.has("alice")).toBe(false);
  deleteUser.mockRestore();
});

test("GET /me/export answers a JSON attachment with the user's data", async () => {
  await call("PATCH", "/me", { name: "Alice" });
  const res = await call("GET", "/me/export");
  expect(res.headers.get("Content-Disposition")).toBe(
    'attachment; filename="mediwise-export.json"',
  );
  const body = (await res.json()) as object;
  expect(body).toMatchObject({
    exportedAt: expect.any(String),
    profiles: [{ name: "Alice" }],
    reports: [],
    markers: [],
  });
  expect(Object.keys(body).sort()).toEqual(["exportedAt", "markers", "profiles", "reports"]);
});
