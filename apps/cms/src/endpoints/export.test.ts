import { createLocalReq, type Payload } from "payload";
import { beforeAll, expect, test } from "vitest";
import { seed } from "../seed/seed";
import { createTestPayload } from "../testing";
import { buildExport, exportEndpoint } from "./export";

type ExportBody = Awaited<ReturnType<typeof buildExport>>;

let payload: Payload;

beforeAll(async () => {
  payload = await createTestPayload();
  await seed(payload, { email: "admin@example.com", password: "x".repeat(16) });
});

const callExport = async (query: string) => {
  const req = await createLocalReq({ urlSuffix: `/api/content/export${query}` }, payload);
  return exportEndpoint.handler(req);
};

const readExport = async (locale: "en" | "hi") =>
  (await (await callExport(`?locale=${locale}`)).json()) as ExportBody;

const findFaq = async (key: string) =>
  (await payload.find({ collection: "faq", where: { key: { equals: key } } })).docs[0]!;

test("the English export returns every published page and FAQ item as HTML with a 60 s cache", async () => {
  const response = await callExport("?locale=en");
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("public, max-age=60");
  const body = (await response.json()) as ExportBody;
  expect(Object.keys(body.pages).sort()).toEqual([
    "contact",
    "privacy",
    "refunds",
    "security",
    "terms",
  ]);
  expect(body.pages.terms?.html).toContain("<h2>What MediWise does</h2>");
  expect(body.pages.terms?.html).toContain(
    "<p>MediWise reads your lab reports and explains each marker.</p>",
  );
  expect(body.pages.privacy?.html).toContain('<span id="washington"></span>United States');
  expect(body.pages.security?.html).toContain(
    'href="https://github.com/theyashgupta/mediwise/blob/main/SECURITY.md"',
  );
  expect(body.pages.security?.description).toBe(
    "The controls that protect your reports in MediWise, and how to report a vulnerability.",
  );
  expect(body.pages.terms?.updatedAt).toEqual(expect.any(String));
  expect(body.faq.map((item) => item.key)).toEqual([
    "upload",
    "labs",
    "accuracy",
    "diagnosis",
    "data",
    "refund",
    "family",
  ]);
  expect(body.faq[0]?.html).toContain("up to {maxFiles} files in one report");
});

test("the Hindi export returns Hindi FAQ and security text and English legal pages", async () => {
  const body = await readExport("hi");
  expect(body.faq[0]?.question).toBe("क्या-क्या अपलोड कर सकते हैं?");
  expect(body.pages.security?.title).toBe("MediWise आपके डेटा की सुरक्षा कैसे करता है");
  expect(body.pages.terms?.title).toBe("Terms of use");
});

test.each(["?locale=fr", ""])("the query %s returns 400 with the locale message", async (query) => {
  const response = await callExport(query);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ errors: [{ message: "Locale must be en or hi." }] });
});

test("a document that was never published is left out", async () => {
  await payload.create({
    collection: "faq",
    draft: true,
    data: { key: "draft-only", question: "Draft only?", order: 99 },
  });
  const body = await readExport("en");
  expect(body.faq.map((item) => item.key)).not.toContain("draft-only");
});

test("a newer draft does not replace the published text", async () => {
  const refund = await findFaq("refund");
  await payload.update({
    collection: "faq",
    id: refund.id,
    draft: true,
    data: { question: "Unpublished draft question?" },
  });
  const body = await readExport("en");
  expect(body.faq.find((item) => item.key === "refund")?.question).toBe("Can I get a refund?");
  expect(JSON.stringify(body)).not.toContain("Unpublished draft question?");
});

test("the export holds no user or version data", async () => {
  const text = JSON.stringify(await readExport("en"));
  expect(text).not.toContain("admin@example.com");
  expect(text).not.toContain("_status");
  expect(text).not.toContain('"version');
});
