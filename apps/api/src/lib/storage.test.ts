import { beforeEach, expect, test, vi } from "vitest";

const edge = vi.hoisted(() => ({
  existing: null as { name: string } | null,
  error: null as Error | null,
  calls: [] as unknown[][],
}));

vi.mock("./supabase.js", () => {
  const answer =
    (name: string, data: unknown) =>
    (...args: unknown[]) => {
      edge.calls.push([name, ...args]);
      return Promise.resolve({ data: edge.error ? null : data, error: edge.error });
    };
  return {
    supabase: {
      storage: {
        getBucket: async () => ({ data: edge.existing, error: null }),
        createBucket: answer("createBucket", { name: "reports" }),
        from: (bucket: string) => ({
          createSignedUploadUrl: answer(`${bucket}.createSignedUploadUrl`, { token: "t" }),
          createSignedUrls: answer(`${bucket}.createSignedUrls`, [
            { path: "u/r/0.pdf", signedUrl: "https://signed/0?token=t", error: null },
            { path: "u/r/1.jpg", signedUrl: null, error: "Object not found" },
          ]),
          list: answer(`${bucket}.list`, [{ name: "a.pdf" }]),
          remove: answer(`${bucket}.remove`, []),
          upload: answer(`${bucket}.upload`, { path: "a.pdf" }),
          download: answer(`${bucket}.download`, new Blob(["%PDF"])),
        }),
      },
    },
  };
});

const storage = await import("./storage.js");

beforeEach(() => {
  edge.existing = null;
  edge.error = null;
  edge.calls = [];
});

test("the reports bucket is created private only when it is missing", async () => {
  await storage.ensureReportsBucket();
  edge.existing = { name: "reports" };
  await storage.ensureReportsBucket();

  expect(edge.calls).toEqual([["createBucket", "reports", { public: false }]]);
});

test("each call goes to the reports bucket and returns its data", async () => {
  expect(await storage.createSignedUploadUrl("a.pdf")).toEqual({ token: "t" });
  expect(await storage.list("user/")).toEqual([{ name: "a.pdf" }]);
  expect(await storage.remove(["a.pdf"])).toEqual([]);
  expect(await storage.upload("a.pdf", Buffer.from("x"), "application/pdf")).toEqual({
    path: "a.pdf",
  });
  expect((await storage.download("a.pdf")).toString()).toBe("%PDF");

  expect(edge.calls).toContainEqual([
    "reports.upload",
    "a.pdf",
    Buffer.from("x"),
    { contentType: "application/pdf", upsert: true },
  ]);
});

test("download URLs last 5 minutes, carry the file name and skip a file that storage does not have", async () => {
  const files = [
    { path: "u/r/0.pdf", name: "Blood test 2025.pdf" },
    { path: "u/r/1.jpg", name: "page.jpg" },
  ];

  expect(await storage.createSignedDownloadUrls(files)).toEqual([
    {
      path: "u/r/0.pdf",
      name: "Blood test 2025.pdf",
      url: "https://signed/0?token=t&download=Blood%20test%202025.pdf",
    },
  ]);
  expect(edge.calls).toEqual([["reports.createSignedUrls", ["u/r/0.pdf", "u/r/1.jpg"], 300]]);
});

test("no files makes no storage call", async () => {
  expect(await storage.createSignedDownloadUrls([])).toEqual([]);
  expect(edge.calls).toEqual([]);
});

test("a storage error is thrown, never returned as data", async () => {
  edge.error = new Error("bucket not found");

  await expect(storage.list("user/")).rejects.toThrow("bucket not found");
});
