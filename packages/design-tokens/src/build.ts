import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { cssFormat, nativeFormat } from "./formats.ts";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Creates the Style Dictionary that turns `tokens/*.json` into `build/tokens.css` and `build/tokens.ts`.
 */
export function createDictionary() {
  const dictionary = new StyleDictionary({
    source: [`${packageRoot}tokens/**/*.json`],
    log: { verbosity: "silent", warnings: "disabled" },
    platforms: {
      css: {
        buildPath: `${packageRoot}build/`,
        files: [{ destination: "tokens.css", format: "mediwise/css" }],
      },
      native: {
        buildPath: `${packageRoot}build/`,
        files: [{ destination: "tokens.ts", format: "mediwise/native" }],
      },
    },
  });
  dictionary.registerFormat({
    name: "mediwise/css",
    format: ({ dictionary: { allTokens } }) => cssFormat(allTokens),
  });
  dictionary.registerFormat({
    name: "mediwise/native",
    format: ({ dictionary: { allTokens } }) => nativeFormat(allTokens),
  });
  return dictionary;
}

if (import.meta.main) await createDictionary().buildAllPlatforms();
