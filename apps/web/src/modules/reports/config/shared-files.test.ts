import { expect, test } from "vitest";
import { sharedFilesLine, validateUploadSearch } from "./shared-files";

test("the upload page keeps the shared flag and drops other search values", () => {
  expect(validateUploadSearch({ shared: 1, other: "x" })).toEqual({ shared: 1 });
  expect(validateUploadSearch({ shared: "1" })).toEqual({ shared: 1 });
  expect(validateUploadSearch({ shared: "yes" })).toEqual({});
});

test("the shared files line counts one file and many files", () => {
  expect(sharedFilesLine(1)).toBe(
    "We added 1 file from another app. Check the profile. Then select Read my report.",
  );
  expect(sharedFilesLine(3)).toMatch(/^We added 3 files from another app\./);
});
