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
