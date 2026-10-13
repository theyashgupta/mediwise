import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const origin = "https://app.example.test";
const source = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");
const shell = {
  version: "v2",
  files: ["/", "/assets/index-abc123.js", "/assets/index-def456.css"],
};

type Listener = (event: unknown) => void;

/**
 * Runs `public/sw.js` against a fake worker scope, an in-memory Cache Storage and a fake network.
 *
 * @remarks
 * `build` stands for the line the production build writes above the file. Without it the worker runs as on the dev server.
 */
function loadWorker({ build, online = true }: { build?: typeof shell; online?: boolean } = {}) {
  const listeners: Record<string, Listener> = {};
  const stored = new Map<string, Map<string, Response>>([["mediwise-shell-v1", new Map()]]);
  const fetched: string[] = [];
  let skipped = false;
  const network = async (input: Request | string) => {
    const url = typeof input === "string" ? new URL(input, origin).href : input.url;
    fetched.push(url);
    if (!online) throw new TypeError("Failed to fetch");
    return new Response(`network ${url}`);
  };
  const caches = {
    open: async (name: string) => {
      const cache = stored.get(name) ?? new Map<string, Response>();
      stored.set(name, cache);
      return {
        put: async (key: string, response: Response) => void cache.set(key, response),
        addAll: async (keys: string[]) => {
          for (const key of keys) cache.set(key, await network(key));
        },
        match: async (key: string) => cache.get(key)?.clone(),
      };
    },
    keys: async () => [...stored.keys()],
    delete: async (name: string) => stored.delete(name),
  };
  const self = {
    mediwiseBuild: build,
    addEventListener: (type: string, listener: Listener) => {
      listeners[type] = listener;
    },
    skipWaiting: () => {
      skipped = true;
    },
    clients: { claim: async () => undefined },
  };
  new Function("self", "caches", "location", "fetch", source)(
    self,
    caches,
    new URL(origin),
    network,
  );

  /** Sends one lifecycle event and waits for the work it hands to `waitUntil`. */
  async function lifecycle(type: "install" | "activate") {
    let work: Promise<unknown> = Promise.resolve();
    listeners[type]?.({ waitUntil: (promise: Promise<unknown>) => (work = promise) });
    await work;
  }

  /** Sends one request through the fetch listener and returns the answer, or undefined when the worker lets it pass. */
  function request(input: Request, mode?: RequestMode) {
    let answer: Promise<Response> | undefined;
    const request = mode ? Object.defineProperty(input, "mode", { value: mode }) : input;
    listeners.fetch?.({
      request,
      respondWith: (response: Promise<Response>) => (answer = response),
    });
    return answer;
  }

  return {
    lifecycle,
    request,
    stored,
    fetched,
    message: (data: unknown) => listeners.message?.({ data }),
    skipped: () => skipped,
    setOnline: (value: boolean) => (online = value),
  };
}

/** Lists every URL in every cache of the fake Cache Storage. */
function cachedKeys(stored: Map<string, Map<string, Response>>) {
  return [...stored.values()].flatMap((cache) => [...cache.keys()]);
}

test("a shared PDF is kept under one key and the page goes to the upload page", async () => {
  const worker = loadWorker();
  const form = new FormData();
  form.append("files", new File(["%PDF-1.4"], "report.pdf", { type: "application/pdf" }));
  const response = await worker.request(
    new Request(`${origin}/share-target`, { method: "POST", body: form }),
  );

  expect(response?.status).toBe(303);
  expect(response?.headers.get("location")).toBe(`${origin}/reports/upload?shared=1`);
  const kept = await worker.stored.get("mediwise-share")?.get("/share-target/files")?.formData();
  const [file] = kept?.getAll("files") ?? [];
  expect(file).toBeInstanceOf(File);
  expect((file as File).name).toBe("report.pdf");
});

test("on the dev server the worker keeps no shell and lets every GET pass", async () => {
  const worker = loadWorker();
  await worker.lifecycle("install");

  expect(worker.request(new Request(`${origin}/`), "navigate")).toBeUndefined();
  expect(worker.request(new Request(`${origin}/src/main.tsx`))).toBeUndefined();
  expect(cachedKeys(worker.stored)).toEqual([]);
});

test("install keeps only the build files, and API calls never enter Cache Storage", async () => {
  const worker = loadWorker({ build: shell });
  await worker.lifecycle("install");
  const requests = [
    new Request("https://api.example.test/reports"),
    new Request("https://api.example.test/reports/r1/export"),
    new Request(`${origin}/api/reports`),
    new Request(`${origin}/api/reports`, { method: "POST" }),
    new Request(`${origin}/share-target`),
    new Request(`${origin}/assets/unknown-999.js`),
  ];

  expect(requests.map((request) => worker.request(request))).toEqual(requests.map(() => undefined));
  expect(worker.request(new Request(`${origin}/api/me`), "navigate")).toBeUndefined();
  expect(cachedKeys(worker.stored).sort()).toEqual([...shell.files].sort());
});

test("a build file comes from the shell cache, also offline", async () => {
  const worker = loadWorker({ build: shell });
  await worker.lifecycle("install");
  worker.setOnline(false);

  const response = await worker.request(new Request(`${origin}/assets/index-abc123.js`));
  expect(await response?.text()).toBe(`network ${origin}/assets/index-abc123.js`);
});

test("a page loads from the network online and from the kept shell offline", async () => {
  const worker = loadWorker({ build: shell });
  await worker.lifecycle("install");

  const online = await worker.request(new Request(`${origin}/reports/r1`), "navigate");
  expect(await online?.text()).toBe(`network ${origin}/reports/r1`);

  worker.setOnline(false);
  const offline = await worker.request(new Request(`${origin}/reports/r1`), "navigate");
  expect(await offline?.text()).toBe(`network ${origin}/`);
});

test("activate deletes the shell of every earlier build and keeps the shared files", async () => {
  const worker = loadWorker({ build: shell });
  worker.stored.set("mediwise-share", new Map());
  await worker.lifecycle("install");
  await worker.lifecycle("activate");

  expect([...worker.stored.keys()].sort()).toEqual(["mediwise-share", "mediwise-shell-v2"]);
});

test("a new build waits until the page sends skip-waiting", async () => {
  const worker = loadWorker({ build: shell });
  await worker.lifecycle("install");
  expect(worker.skipped()).toBe(false);

  worker.message("something else");
  expect(worker.skipped()).toBe(false);
  worker.message("skip-waiting");
  expect(worker.skipped()).toBe(true);
});
