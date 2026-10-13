import type { ProfileInput, ProfileUpdate } from "@mediwise/shared";
import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { profilesRoutes } from "./profiles.routes.js";

const store = vi.hoisted(() => {
  type Row = {
    id: string;
    ownerUserId: string;
    name: string;
    relation: string;
    dateOfBirth: string | null;
    sex: string | null;
    ancestry: string;
    isSelf: boolean;
  };
  const rows: Row[] = [];
  const owned = (owner: string) => rows.filter((row) => row.ownerUserId === owner);
  const find = (owner: string, id: string) => owned(owner).find((row) => row.id === id);
  return {
    rows,
    repo: {
      listProfilesByOwner: async (owner: string) =>
        owned(owner)
          .sort((a, b) => Number(b.isSelf) - Number(a.isSelf))
          .map((row) => ({ ...row, reportCount: 0 })),
      findProfileById: async (owner: string, id: string) => find(owner, id),
      countProfilesByOwner: async (owner: string) => owned(owner).length,
      insertProfile: async (owner: string, input: ProfileInput) => {
        const row = { ...input, id: crypto.randomUUID(), ownerUserId: owner, isSelf: false };
        rows.push(row);
        return row;
      },
      insertSelfProfileIfMissing: async (owner: string, name: string) => {
        if (owned(owner).some((row) => row.isSelf)) return;
        rows.push({
          id: crypto.randomUUID(),
          ownerUserId: owner,
          name,
          relation: "self",
          dateOfBirth: null,
          sex: null,
          ancestry: "unknown",
          isSelf: true,
        });
      },
      updateProfile: async (owner: string, id: string, input: ProfileUpdate) => {
        const row = find(owner, id);
        return row && Object.assign(row, input);
      },
      deleteProfile: async (owner: string, id: string) => {
        const row = find(owner, id);
        if (row) rows.splice(rows.indexOf(row), 1);
      },
    },
  };
});

vi.mock("./profiles.repo.js", () => store.repo);

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    c.set("email", `${c.var.userId}@example.com`);
    await next();
  })
  .route("/profiles", profilesRoutes);
app.onError(handleError);

const member = {
  name: "Asha",
  relation: "parent",
  dateOfBirth: "1960-02-29",
  sex: "female",
  ancestry: "south_asian",
};

function call(method: string, path: string, user = "alice", body?: object) {
  return app.request(path, {
    method,
    headers: { "x-user": user, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
}

async function createMember(user = "alice") {
  const res = await call("POST", "/profiles", user, member);
  return (await res.json()) as { id: string };
}

beforeEach(() => {
  store.rows.length = 0;
});

test("GET /profiles creates the self profile on the first call", async () => {
  const res = await call("GET", "/profiles");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual([
    expect.objectContaining({ name: "alice", relation: "self", isSelf: true, dateOfBirth: null }),
  ]);
});

test("a created family member is listed after the self profile", async () => {
  await call("GET", "/profiles");
  const res = await call("POST", "/profiles", "alice", member);
  expect(res.status).toBe(201);
  const list = (await (await call("GET", "/profiles")).json()) as { name: string }[];
  expect(list.map((profile) => profile.name)).toEqual(["alice", "Asha"]);
});

test("a profile of another user returns 404 on update and delete", async () => {
  const { id } = await createMember("alice");
  expect((await call("PATCH", `/profiles/${id}`, "bob", { name: "Mallory" })).status).toBe(404);
  expect((await call("DELETE", `/profiles/${id}`, "bob")).status).toBe(404);
  const bobList = (await (await call("GET", "/profiles", "bob")).json()) as { id: string }[];
  expect(bobList.map((profile) => profile.id)).not.toContain(id);
  expect(store.rows.find((row) => row.id === id)?.name).toBe("Asha");
});

test("the ninth profile returns 409", async () => {
  await call("GET", "/profiles");
  for (let i = 0; i < 7; i++)
    expect((await call("POST", "/profiles", "alice", member)).status).toBe(201);
  const res = await call("POST", "/profiles", "alice", member);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ title: "You can have up to 8 profiles" });
});

test("the self profile cannot be removed", async () => {
  const [self] = (await (await call("GET", "/profiles")).json()) as { id: string }[];
  expect((await call("DELETE", `/profiles/${self?.id}`)).status).toBe(409);
});

test("a second self profile cannot be created", async () => {
  expect((await call("POST", "/profiles", "alice", { ...member, relation: "self" })).status).toBe(
    409,
  );
});

test("a family member is updated and removed", async () => {
  const { id } = await createMember();
  const res = await call("PATCH", `/profiles/${id}`, "alice", { name: "Asha Rao" });
  expect(await res.json()).toMatchObject({ name: "Asha Rao", relation: "parent" });
  expect((await call("DELETE", `/profiles/${id}`)).status).toBe(204);
  expect((await call("PATCH", `/profiles/${id}`, "alice", { name: "x" })).status).toBe(404);
});

test("an invalid body returns a 400 problem", async () => {
  const res = await call("POST", "/profiles", "alice", { ...member, dateOfBirth: "29/02/1960" });
  expect(res.status).toBe(400);
});
