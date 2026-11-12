import type { Payload } from "payload";
import type { User } from "./payload-types";
import { beforeAll, expect, test } from "vitest";
import { createTestPayload } from "./testing";

let payload: Payload;
let admin: User;

beforeAll(async () => {
  payload = await createTestPayload();
  admin = await payload.create({
    collection: "users",
    data: { email: "admin@example.com", password: "x".repeat(16) },
  });
  await payload.create({
    collection: "pages",
    data: { slug: "terms", title: "Terms", _status: "published" },
  });
});

test.each(["users", "pages", "faq"] as const)(
  "an anonymous read of %s is refused",
  async (collection) => {
    await expect(payload.find({ collection, overrideAccess: false })).rejects.toThrow(
      /not allowed/i,
    );
  },
);

test("an anonymous write of pages is refused", async () => {
  await expect(
    payload.create({ collection: "pages", data: { slug: "x", title: "X" }, overrideAccess: false }),
  ).rejects.toThrow(/not allowed/i);
});

test("an anonymous write of faq is refused", async () => {
  await expect(
    payload.create({
      collection: "faq",
      data: { key: "x", question: "X", order: 1 },
      overrideAccess: false,
    }),
  ).rejects.toThrow(/not allowed/i);
});

test("a signed-in user reads pages", async () => {
  const result = await payload.find({ collection: "pages", overrideAccess: false, user: admin });
  expect(result.docs.map((page) => page.slug)).toEqual(["terms"]);
});

test.each(["pages", "faq"] as const)(
  "an anonymous read of %s versions is refused",
  async (collection) => {
    await expect(payload.findVersions({ collection, overrideAccess: false })).rejects.toThrow(
      /not allowed/i,
    );
  },
);

test("an anonymous user cannot create a second user", async () => {
  await expect(
    payload.create({
      collection: "users",
      data: { email: "intruder@example.com", password: "y".repeat(16) },
      overrideAccess: false,
    }),
  ).rejects.toThrow(/not allowed/i);
});
