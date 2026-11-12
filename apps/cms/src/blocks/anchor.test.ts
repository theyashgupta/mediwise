import type { Payload } from "payload";
import { beforeAll, expect, test } from "vitest";
import { createTestPayload } from "../testing";
import { validateAnchorId } from "./anchor";

test.each(["washington", "section-2", "eu-eea-uk"])("the anchor id %s is valid", (value) => {
  expect(validateAnchorId(value)).toBe(true);
});

test.each(["Washington!", "", "two words", "-lead", "trail-", "a--b", null, undefined])(
  "the anchor id %s is refused",
  (value) => {
    expect(validateAnchorId(value)).toBe(
      "Use lowercase letters and digits, with one hyphen between two groups.",
    );
  },
);

let payload: Payload;

beforeAll(async () => {
  payload = await createTestPayload();
});

const bodyWithAnchor = (anchorId: string) => ({
  root: {
    type: "root",
    version: 1,
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    children: [
      {
        type: "heading",
        tag: "h2",
        version: 1,
        direction: "ltr",
        format: "",
        indent: 0,
        children: [
          {
            type: "inlineBlock",
            version: 1,
            fields: { id: "a1b2c3", blockType: "anchor", blockName: "", anchorId },
          },
          {
            type: "text",
            text: "United States",
            version: 1,
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
          },
        ],
      },
    ],
  },
});

test("a page with an invalid anchor id is refused", async () => {
  await expect(
    payload.create({
      collection: "pages",
      data: { slug: "bad", title: "Bad", body: bodyWithAnchor("Washington!") },
    }),
  ).rejects.toThrow(/body/i);
});

test("a page with a valid anchor id is stored", async () => {
  const page = await payload.create({
    collection: "pages",
    data: { slug: "good", title: "Good", body: bodyWithAnchor("washington") },
  });
  expect(JSON.stringify(page.body)).toContain('"anchorId":"washington"');
});
