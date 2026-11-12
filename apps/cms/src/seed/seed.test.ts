import type { Payload } from "payload";
import { beforeAll, expect, test } from "vitest";
import { createTestPayload } from "../testing";
import { seed } from "./seed";

const admin = { email: "admin@example.com", password: "x".repeat(16) };
let payload: Payload;

beforeAll(async () => {
  payload = await createTestPayload();
  await seed(payload, admin);
});

const findPage = async (slug: string, locale: "en" | "hi" = "en") =>
  (await payload.find({ collection: "pages", locale, where: { slug: { equals: slug } } })).docs[0];

const findFaq = async (key: string, locale: "en" | "hi" = "en") =>
  (await payload.find({ collection: "faq", locale, where: { key: { equals: key } } })).docs[0];

test("the seed publishes five pages and seven FAQ items", async () => {
  const pages = await payload.find({
    collection: "pages",
    where: { _status: { equals: "published" } },
  });
  const faq = await payload.find({
    collection: "faq",
    where: { _status: { equals: "published" } },
  });
  expect(pages.docs.map((page) => page.slug).sort()).toEqual([
    "contact",
    "privacy",
    "refunds",
    "security",
    "terms",
  ]);
  expect(faq.totalDocs).toBe(7);
});

test("a second run keeps the same documents and does not overwrite an edit", async () => {
  const before = await payload.find({ collection: "pages", limit: 0 });
  const terms = await findPage("terms");
  await payload.update({ collection: "pages", id: terms!.id, data: { title: "Edited title" } });
  await seed(payload, admin);
  const after = await payload.find({ collection: "pages", limit: 0 });
  expect(after.docs.map((page) => page.id).sort()).toEqual(
    before.docs.map((page) => page.id).sort(),
  );
  expect((await findPage("terms"))?.title).toBe("Edited title");
  expect((await payload.count({ collection: "faq" })).totalDocs).toBe(7);
  expect((await payload.count({ collection: "users" })).totalDocs).toBe(1);
});

test("the privacy body keeps the washington anchor on the United States heading", async () => {
  const privacy = await findPage("privacy");
  const headings = (privacy?.body?.root.children ?? []).filter((node) => node.type === "heading");
  const unitedStates = headings.find((node) => JSON.stringify(node).includes("United States"));
  expect(JSON.stringify(unitedStates)).toContain('"anchorId":"washington"');
});

test("FAQ answers keep tokens in place of the numbers from the code", async () => {
  const upload = await findFaq("upload");
  expect(JSON.stringify(upload?.answer)).toContain("up to {maxFiles} files in one report");
  expect(JSON.stringify((await findFaq("diagnosis"))?.answer)).toContain("No. {disclaimer}");
});

test("Hindi reads return the Hindi FAQ and fall back to English for the legal pages", async () => {
  expect((await findFaq("upload", "hi"))?.question).toBe("क्या-क्या अपलोड कर सकते हैं?");
  expect((await findPage("privacy", "hi"))?.title).toBe("Privacy policy");
  expect((await findPage("security", "hi"))?.title).toBe(
    "MediWise आपके डेटा की सुरक्षा कैसे करता है",
  );
});
