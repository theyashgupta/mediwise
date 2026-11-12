import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { createDictionary } from "./build.ts";

test.each(["css", "native"])(
  "the committed %s output matches the tokens, so run the build after a token change",
  async (platform) => {
    const [file] = await createDictionary().formatPlatform(platform);
    const committed = readFileSync(file!.destination!, "utf8");
    expect(committed).toBe(file!.output);
  },
);

test("the css output carries the rounder radius steps", async () => {
  const [file] = await createDictionary().formatPlatform("css");
  for (const line of [
    "--radius: 0.625rem;",
    "--radius-lg: 0.625rem;",
    "--radius-xl: 0.875rem;",
    "--radius-2xl: 1.25rem;",
  ]) {
    expect(String(file!.output)).toContain(line);
  }
});
