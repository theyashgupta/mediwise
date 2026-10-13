import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const origin = "https://app.example.test";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

/** Runs `public/sw.js` against a fake worker scope and an in-memory Cache Storage. */
function loadWorker() {
  const listeners: Record<string, (event: unknown) => void> = {};
  const stored = new Map<string, Map<string, Response>>();
  const caches = {
    open: async (name: string) => {
      const cache = stored.get(name) ?? new Map<string, Response>();
      stored.set(name, cache);
      return { put: async (key: string, response: Response) => void cache.set(key, response) };
    },
  };
  const self = {
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners[type] = listener;
    },
  };
  new Function("self", "caches", "location", source)(self, caches, new URL(origin));

  /** Sends one request through the fetch listener and returns the answer, or undefined when the worker lets it pass. */
  function fetch(request: Request) {
    let answer: Promise<Response> | undefined;
    listeners.fetch?.({
      request,
      respondWith: (response: Promise<Response>) => (answer = response),
    });
    return answer;
  }
  return { fetch, stored };
}

test("a shared PDF is kept under one key and the page goes to the upload page", async () => {
  const worker = loadWorker();
  const form = new FormData();
  form.append("files", new File(["%PDF-1.4"], "report.pdf", { type: "application/pdf" }));
  const response = await worker.fetch(
    new Request(`${origin}/share-target`, { method: "POST", body: form }),
  );

  expect(response?.status).toBe(303);
  expect(response?.headers.get("location")).toBe(`${origin}/reports/upload?shared=1`);
  const kept = await worker.stored.get("mediwise-share")?.get("/share-target/files")?.formData();
  const [file] = kept?.getAll("files") ?? [];
  expect(file).toBeInstanceOf(File);
  expect((file as File).name).toBe("report.pdf");
});

test("API calls, pages and other origins pass through and nothing enters Cache Storage", () => {
  const worker = loadWorker();
  const requests = [
    new Request("https://api.example.test/reports"),
    new Request("https://api.example.test/share-target", { method: "POST" }),
    new Request(`${origin}/api/reports`),
    new Request(`${origin}/reports/upload`),
    new Request(`${origin}/share-target`),
  ];

  expect(requests.map((request) => worker.fetch(request))).toEqual(requests.map(() => undefined));
  expect(worker.stored.size).toBe(0);
});
