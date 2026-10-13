import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import { env } from "../../config/env.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { reportsRoutes } from "./reports.routes.js";

const store = vi.hoisted(() => {
  type Report = {
    id: string;
    owner: string;
    profileId: string;
    status: string;
    createdAt: Date;
    note?: string | null;
  };
  type File = {
    id?: string;
    reportId: string;
    storagePath: string;
    size: number;
    name?: string;
    pageClasses?: string[] | null;
    skipReason?: string | null;
  };
  const reports: Report[] = [];
  const files: File[] = [];
  const objects = new Map<string, number>();
  const jobs: string[] = [];
  const markerRows: object[] = [];
  const followUpRows: object[] = [];
  const historyRows: object[] = [];
  const studyRows: object[] = [];
  const findingRows: object[] = [];
  const visits = new Map<string, object>();
  const links: object[] = [];
  const insights: { current?: object } = {};
  const credits = new Map<string, { balance: number; readsToday: number }>();
  const view = ({ id, profileId, status, createdAt, note }: Report) => ({
    id,
    profileId,
    status,
    createdAt,
    note: note ?? null,
    markerCount: 0,
  });
  const find = (owner: string, id: string) =>
    reports.find((report) => report.id === id && report.owner === owner);
  const drop = (match: (report: Report) => boolean) => {
    const gone = reports.filter(match);
    gone.forEach((report) => reports.splice(reports.indexOf(report), 1));
    const ids = gone.map((report) => report.id);
    return {
      deletedCount: ids.length,
      paths: files.filter((file) => ids.includes(file.reportId)).map((file) => file.storagePath),
    };
  };
  return {
    reports,
    files,
    objects,
    jobs,
    markerRows,
    followUpRows,
    historyRows,
    studyRows,
    findingRows,
    visits,
    links,
    insights,
    credits,
    findingsRepo: {
      listFindings: async () => findingRows,
      findVisit: async (id: string) => {
        const visit = visits.get(id);
        return visit && { profileId: aliceProfile, patterns: [], visit };
      },
    },
    linksRepo: { listLinks: async () => links, listReportsAfter: async () => [] },
    profilesRepo: {
      findProfileById: async (owner: string, id: string) =>
        owner === "alice" && id === aliceProfile ? { id, isSelf: true } : undefined,
    },
    storage: {
      createSignedUploadUrl: async (path: string) => ({ signedUrl: `https://storage/${path}` }),
      list: async (prefix: string) =>
        [...objects]
          .filter(([path]) => path.startsWith(`${prefix}/`))
          .map(([path, size]) => ({ name: path.slice(prefix.length + 1), metadata: { size } })),
      remove: async (paths: string[]) => paths.forEach((path) => objects.delete(path)),
    },
    repo: {
      findReportById: async (owner: string, id: string) => {
        const report = find(owner, id);
        return report && view(report);
      },
      listReportFiles: async (reportId: string) =>
        files.filter((file) => file.reportId === reportId),
      listReportsByProfile: async (owner: string, profileId: string, limit: number) =>
        reports
          .filter((r) => r.owner === owner && r.profileId === profileId && r.status !== "draft")
          .map((report) => ({ ...view(report), cursor: report.createdAt.toISOString() }))
          .slice(0, limit),
      insertDraftReport: async (
        owner: string,
        report: { id: string; profileId: string },
        reportFiles: { storagePath: string; size: number }[],
        check: (usage: { balance: number; readsToday: number; waiting: number }) => void,
      ) => {
        check({
          ...(credits.get(owner) ?? { balance: 0, readsToday: 0 }),
          waiting: reports.filter(
            (r) => r.owner === owner && ["draft", "queued", "paused"].includes(r.status),
          ).length,
        });
        reports.push({ ...report, owner, status: "draft", createdAt: new Date() });
        files.push(...reportFiles.map((file) => ({ ...file, reportId: report.id })));
      },
      queueDraftReport: async (owner: string, id: string) => {
        const report = find(owner, id);
        if (report?.status !== "draft") return;
        report.status = "queued";
        jobs.push(id);
      },
      deleteReport: async (owner: string, id: string) =>
        drop((r) => r.owner === owner && r.id === id && r.status !== "processing"),
      deleteDraftsCreatedBefore: async (owner: string, before: Date) =>
        drop((r) => r.owner === owner && r.status === "draft" && r.createdAt < before),
      listReportMarkers: async () => markerRows,
      listFollowUps: async () => followUpRows,
      findReportInsights: async () => insights.current,
      listStudies: async () => studyRows,
      findReportProfile: async (owner: string, id: string) =>
        find(owner, id) && { id: aliceProfile, sex: "male", ancestry: "south_asian" },
      listMarkerHistory: async () => historyRows,
      findReadJobTokens: async () => ({ usage: null, inputTokens: 10_000, outputTokens: 1_000 }),
      updateReportNote: async (owner: string, id: string, note: string | null) => {
        const report = find(owner, id);
        if (!report) return undefined;
        report.note = note;
        return { note };
      },
      requeueFailedReport: async (owner: string, id: string) => {
        const report = find(owner, id);
        if (report?.status !== "failed") return;
        report.status = "queued";
        jobs.push(id);
      },
    },
  };
});
const aliceProfile = vi.hoisted(() => "5f0c6a8e-6c1a-4a39-9c43-2c1f7c3e2a10");

vi.mock("./reports.repo.js", () => store.repo);
vi.mock("../profiles/profiles.repo.js", () => store.profilesRepo);
vi.mock("../../lib/storage.js", () => store.storage);
vi.mock("../findings/findings.repo.js", () => store.findingsRepo);
vi.mock("../links/links.repo.js", () => store.linksRepo);

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    await next();
  })
  .route("/reports", reportsRoutes);
app.onError(handleError);

const mb = 1024 * 1024;
const pdf = { name: "report.pdf", mime: "application/pdf", size: 3 * mb };
const photo = { name: "page.jpg", mime: "image/jpeg", size: 2 * mb };

function call(method: string, path: string, user = "alice", body?: object) {
  return app.request(path, {
    method,
    headers: { "x-user": user, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
}

async function create(files: object[]) {
  const res = await call("POST", "/reports", "alice", { profileId: aliceProfile, files });
  return { res, body: (await res.json()) as { id: string; uploadUrls: string[] } };
}

/** Plays the browser: PUTs every file to the path its signed URL names. */
function uploadAll(urls: string[], sizes: number[]) {
  urls.forEach((url, i) => store.objects.set(url.replace("https://storage/", ""), sizes[i] ?? 0));
}

async function list() {
  const res = await call("GET", `/reports?profileId=${aliceProfile}`);
  return ((await res.json()) as { items: { id: string; status: string }[] }).items;
}

beforeEach(() => {
  store.reports.length = 0;
  store.files.length = 0;
  store.jobs.length = 0;
  store.findingRows.length = 0;
  store.visits.clear();
  store.links.length = 0;
  store.markerRows.length = 0;
  store.followUpRows.length = 0;
  store.historyRows.length = 0;
  store.studyRows.length = 0;
  store.insights.current = undefined;
  store.objects.clear();
  store.credits.clear();
  store.credits.set("alice", { balance: 50, readsToday: 0 });
  env.CLAUDE_HARD_STOP = false;
});

test("a PDF and a set of photos become two queued reports with their files in storage", async () => {
  const one = await create([pdf]);
  const two = await create([photo, photo]);
  expect(one.res.status).toBe(201);
  expect(one.body.uploadUrls).toEqual([`https://storage/alice/${one.body.id}/0.pdf`]);
  expect(two.body.uploadUrls).toHaveLength(2);
  expect(await list()).toEqual([]);

  uploadAll(one.body.uploadUrls, [pdf.size]);
  uploadAll(two.body.uploadUrls, [photo.size, photo.size]);
  for (const { id } of [one.body, two.body]) {
    const res = await call("POST", `/reports/${id}/uploaded`);
    expect(await res.json()).toMatchObject({ id, status: "queued" });
  }

  expect((await list()).map((report) => report.status)).toEqual(["queued", "queued"]);
  expect(store.jobs).toEqual([one.body.id, two.body.id]);
  expect(store.objects.size).toBe(3);
});

test("PDFs and photos in one upload become one report with one upload URL per file", async () => {
  const { res, body } = await create([pdf, pdf, photo]);
  expect(res.status).toBe(201);
  expect(body.uploadUrls).toEqual([
    `https://storage/alice/${body.id}/0.pdf`,
    `https://storage/alice/${body.id}/1.pdf`,
    `https://storage/alice/${body.id}/2.jpg`,
  ]);
  expect(store.files.map((file) => file.name)).toEqual(["report.pdf", "report.pdf", "page.jpg"]);
});

test("21 files and a 30 MB file are refused with a 400", async () => {
  expect((await create(Array(21).fill(photo))).res.status).toBe(400);
  expect((await create([{ ...pdf, size: 30 * mb }])).res.status).toBe(400);
  expect(store.reports).toEqual([]);
});

test("a report lists its other documents, its skipped duplicates and a removed identity page", async () => {
  const { body } = await create([pdf]);
  store.files.length = 0;
  const file = (name: string, pageClasses: string[] | null, skipReason: string | null = null) =>
    store.files.push({
      reportId: body.id,
      storagePath: "",
      size: 1,
      name,
      pageClasses,
      skipReason,
    });
  file("lab-a.pdf", ["lab_panel", "lab_panel", "imaging_report"]);
  file("medical-reports.pdf", null, "duplicate");
  file("usg.pdf", ["imaging_report"]);
  file("mer-id.pdf", ["examination_form", "identity_document"]);
  file("aadhaar.jpg", ["identity_document"], "identity");
  file("discharge.pdf", ["other"]);
  file("chest-xray.jpg", ["raw_image"]);

  const res = await call("GET", `/reports/${body.id}`);

  expect(((await res.json()) as { files: unknown }).files).toEqual({
    otherDocuments: [{ name: "discharge.pdf", documentClass: "other" }],
    images: ["chest-xray.jpg"],
    duplicates: ["medical-reports.pdf"],
    identityRemoved: true,
  });
});

test("a report for another user's profile returns 404", async () => {
  const res = await call("POST", "/reports", "bob", { profileId: aliceProfile, files: [pdf] });
  expect(res.status).toBe(404);
});

test("another user cannot read, confirm or delete a report", async () => {
  const { body } = await create([pdf]);
  expect((await call("GET", `/reports/${body.id}`, "bob")).status).toBe(404);
  expect((await call("POST", `/reports/${body.id}/uploaded`, "bob")).status).toBe(404);
  expect((await call("DELETE", `/reports/${body.id}`, "bob")).status).toBe(404);
});

test("confirming before every file arrives, or with a different size, returns 409", async () => {
  const { body } = await create([photo, photo]);
  uploadAll(body.uploadUrls.slice(0, 1), [photo.size]);
  expect((await call("POST", `/reports/${body.id}/uploaded`)).status).toBe(409);
  uploadAll(body.uploadUrls, [photo.size, 9 * mb]);
  expect((await call("POST", `/reports/${body.id}/uploaded`)).status).toBe(409);
  expect(store.jobs).toEqual([]);
});

test("confirming twice adds one job", async () => {
  const { body } = await create([pdf]);
  uploadAll(body.uploadUrls, [pdf.size]);
  await call("POST", `/reports/${body.id}/uploaded`);
  expect((await call("POST", `/reports/${body.id}/uploaded`)).status).toBe(200);
  expect(store.jobs).toHaveLength(1);
});

test("deleting a report removes its files, and a processing report returns 409", async () => {
  const { body } = await create([pdf]);
  uploadAll(body.uploadUrls, [pdf.size]);
  expect((await call("DELETE", `/reports/${body.id}`)).status).toBe(204);
  expect(store.objects.size).toBe(0);
  expect((await call("GET", `/reports/${body.id}`)).status).toBe(404);

  const busy = await create([pdf]);
  const report = store.reports.find((r) => r.id === busy.body.id);
  if (report) report.status = "processing";
  expect((await call("DELETE", `/reports/${busy.body.id}`)).status).toBe(409);
});

test("a draft older than one hour is deleted with its files on the next list", async () => {
  const { body } = await create([pdf]);
  uploadAll(body.uploadUrls, [pdf.size]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.createdAt = new Date(Date.now() - 61 * 60 * 1000);
  await list();
  expect(store.reports).toEqual([]);
  expect(store.objects.size).toBe(0);
});

/** Builds a stored marker row with every column the detail reads. */
function stored(row: object) {
  return {
    markerKey: null,
    rawName: "",
    value: null,
    valueText: null,
    unit: null,
    labRangeLow: null,
    labRangeHigh: null,
    status: null,
    calibratedLow: null,
    calibratedHigh: null,
    derived: false,
    ...row,
  };
}

test("an unfinished report returns its status and profile with empty sections", async () => {
  const { body } = await create([pdf]);
  const res = await call("GET", `/reports/${body.id}`);
  expect(await res.json()).toMatchObject({
    status: "draft",
    profileId: aliceProfile,
    moveFirst: [],
    categories: [],
    followUps: [],
    patterns: [],
    doctorQuestions: [],
    narrative: null,
    header: { capped: false },
  });
});

test("a saved note comes back with the report, and an empty note clears it", async () => {
  const { body } = await create([pdf]);
  const note = "  Tired for two weeks. Started walking daily.  ";

  const saved = await call("PUT", `/reports/${body.id}/note`, "alice", { note });
  expect(saved.status).toBe(200);
  expect(await saved.json()).toEqual({ note: note.trim() });
  expect(await (await call("GET", `/reports/${body.id}`)).json()).toMatchObject({
    note: note.trim(),
  });

  await call("PUT", `/reports/${body.id}/note`, "alice", { note: " " });
  expect(await (await call("GET", `/reports/${body.id}`)).json()).toMatchObject({ note: null });
});

test("a note of 1,001 characters returns 400, and another user's report returns 404", async () => {
  const { body } = await create([pdf]);

  expect(
    (await call("PUT", `/reports/${body.id}/note`, "alice", { note: "a".repeat(1000) })).status,
  ).toBe(200);
  const long = await call("PUT", `/reports/${body.id}/note`, "alice", { note: "a".repeat(1001) });
  expect(long.status).toBe(400);
  expect(JSON.stringify(await long.json())).toContain("Write 1,000 characters or fewer");
  expect((await call("PUT", `/reports/${body.id}/note`, "bob", { note: "Hi" })).status).toBe(404);
});

test("only ADMIN_USER_ID sees the Claude cost of a report, in cents", async () => {
  const { body } = await create([pdf]);
  env.ADMIN_USER_ID = "admin-user";
  expect(await (await call("GET", `/reports/${body.id}`)).json()).not.toHaveProperty("costCents");

  env.ADMIN_USER_ID = "alice";
  expect(await (await call("GET", `/reports/${body.id}`)).json()).toMatchObject({ costCents: 3 });
  env.ADMIN_USER_ID = undefined;
});

test("a done report returns its stored patterns, findings, doctor questions and narrative", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  const narrative = {
    sections: [{ heading: "The headline", sentences: [{ text: "One.", markerKeys: [] }] }],
  };
  store.insights.current = {
    patterns: [{ key: "gout_risk", matched: [{ markerKey: "uric_acid" }] }],
    doctorQuestions: ["My uric acid is high. What is my risk of gout?"],
    narrative,
  };
  const finding = {
    kind: "change",
    severity: "watch",
    title: "Uric acid worsening: 6.1 mg/dL in Jan 2024, 7.9 mg/dL in Feb 2025",
    body: "Uric acid rose by 1.8 mg/dL.",
    citedKeys: ["uric_acid"],
    citedStudyIds: [],
  };
  store.findingRows.push(finding);

  const detail = await (await call("GET", `/reports/${body.id}`)).json();

  expect(detail).toMatchObject({
    patterns: [{ key: "gout_risk", matched: [{ markerKey: "uric_acid" }] }],
    findings: [{ ...finding, sequence: null }],
    doctorQuestions: ["My uric acid is high. What is my risk of gout?"],
    narrative,
  });
});

test("an alert that a linked later ultrasound settles leaves the findings, the questions and the headline", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  const line = "A 4.2 x 3.1 cm complex mass in the right adnexa.";
  const ultrasound = { kind: "ultrasound", bodyRegion: "Pelvis", result: null, measurements: [] };
  store.visits.set(body.id, {
    date: "2025-02-10",
    labName: null,
    markers: [],
    studies: [{ ...ultrasound, id: "study-a", impression: line }],
  });
  store.visits.set("report-b", {
    date: "2025-03-24",
    labName: null,
    markers: [],
    studies: [{ ...ultrasound, id: "study-b", impression: "No adnexal mass is seen." }],
  });
  store.links.push({
    id: "link-1",
    earlierReportId: body.id,
    laterReportId: "report-b",
    kind: "repeat",
    createdBy: "detector",
    state: "proposed",
    other: { id: "report-b", labName: "Riverside Diagnostics", date: "2025-03-24" },
  });
  const alert = {
    kind: "study_alert",
    severity: "risk",
    title: `Your ultrasound report says: "${line}"`,
    body: "Your ultrasound report prints this line.",
    citedKeys: [],
    citedStudyIds: ["study-a"],
  };
  store.findingRows.push(alert);
  store.insights.current = {
    patterns: [],
    doctorQuestions: [`My ultrasound report says: "${line}" What does this line mean for me?`],
    narrative: {
      sections: [
        {
          heading: "The headline",
          sentences: [
            { text: "Ask your doctor about a line in your ultrasound report.", markerKeys: [] },
            { text: "Most markers are optimal.", markerKeys: [] },
          ],
        },
      ],
    },
  };

  type Detail = {
    findings: object[];
    settled: object[];
    doctorQuestions: string[];
    narrative: { sections: { sentences: object[] }[] };
    links: object[];
  };
  const detail = (await (await call("GET", `/reports/${body.id}`)).json()) as Detail;

  expect(detail.findings).toEqual([]);
  expect(detail.settled).toEqual([
    {
      kind: "study_alert",
      title: alert.title,
      state: "settled",
      earlier: { reportId: body.id, date: "2025-02-10", text: line },
      later: { reportId: "report-b", date: "2025-03-24", text: "No adnexal mass is seen." },
    },
  ]);
  expect(detail.doctorQuestions).toEqual([]);
  expect(detail.narrative.sections[0]?.sentences).toEqual([
    { text: "Most markers are optimal.", markerKeys: [] },
  ]);
  expect(detail.links).toEqual([
    {
      id: "link-1",
      kind: "repeat",
      state: "proposed",
      createdBy: "detector",
      role: "earlier",
      other: { id: "report-b", labName: "Riverside Diagnostics", date: "2025-03-24" },
    },
  ]);

  store.links.length = 0;
  const open = (await (await call("GET", `/reports/${body.id}`)).json()) as Detail;
  expect(open.findings).toEqual([{ ...alert, sequence: null }]);
  expect(open.settled).toEqual([]);
});

test("a done report without stored insights returns empty patterns and no narrative", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  store.insights.current = { patterns: null, doctorQuestions: null, narrative: null };

  const detail = await (await call("GET", `/reports/${body.id}`)).json();

  expect(detail).toMatchObject({ patterns: [], doctorQuestions: [], narrative: null });
});

test("a done report lists its studies impression first, keeps a film with its X-ray, and shows BMI with the vitals", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  store.files.length = 0;
  store.files.push(
    {
      id: "file-lab",
      reportId: body.id,
      storagePath: "",
      size: 1,
      name: "lab-a.pdf",
      pageClasses: ["lab_panel", "imaging_report"],
    },
    {
      id: "file-film",
      reportId: body.id,
      storagePath: "",
      size: 1,
      name: "chest-xray.jpg",
      pageClasses: ["raw_image"],
    },
  );
  store.studyRows.push({
    id: "study-1",
    kind: "ultrasound",
    bodyRegion: "Abdomen and pelvis",
    findingsText: "Liver: increased echogenicity",
    impressionText: "Grade I fatty liver.",
    familyHistory: null,
    performedAt: "2025-02-01",
    signedBy: "Dr. A",
    pageIndex: 0,
    fileName: "usg.pdf",
    filmFileId: "file-film",
    filmName: "chest-xray.jpg",
    measurements: [
      {
        studyId: "study-1",
        key: "spleen_length",
        value: 9,
        valueText: null,
        unit: "cm",
        printedRange: null,
        status: null,
      },
      {
        studyId: "study-1",
        key: "liver_length",
        value: 13,
        valueText: null,
        unit: "cm",
        printedRange: null,
        status: "optimal",
      },
      {
        studyId: "study-1",
        key: "made_up",
        value: 1,
        valueText: null,
        unit: null,
        printedRange: null,
        status: null,
      },
    ],
  } as never);
  store.markerRows.push(
    stored({
      markerKey: "bmi",
      rawName: "Body mass index",
      value: 26.5,
      unit: "kg/m²",
      status: "watch",
      calibratedLow: 18.5,
      calibratedHigh: 22.9,
      derived: true,
    }),
  );

  const detail = (await (await call("GET", `/reports/${body.id}`)).json()) as {
    studies: unknown[];
    files: { images: string[] };
    moveFirst: unknown[];
    derived: unknown[];
    categories: { key: string; markers: { markerKey: string }[] }[];
  };

  expect(detail.studies).toEqual([
    expect.objectContaining({
      kind: "ultrasound",
      impression: "Grade I fatty liver.",
      findings: "Liver: increased echogenicity",
      fileName: "usg.pdf",
      page: 1,
      filmName: "chest-xray.jpg",
      measurements: [
        expect.objectContaining({
          key: "liver_length",
          name: "Liver length",
          value: 13,
          status: "optimal",
        }),
        expect.objectContaining({ key: "spleen_length", status: "unknown" }),
      ],
    }),
  ]);
  expect(detail.files.images).toEqual([]);
  expect(detail.categories).toEqual([
    expect.objectContaining({
      key: "vitals",
      markers: [expect.objectContaining({ markerKey: "bmi" })],
    }),
  ]);
  expect(detail.derived).toEqual([]);
  expect(detail.moveFirst).toEqual([]);
});

test("a done report groups markers by catalog category with catalog copy, ranks move first and lists ratios, unmapped and unmeasured", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  store.markerRows.push(
    stored({ markerKey: "hemoglobin", rawName: "Hb", valueText: "see above" }),
    stored({
      markerKey: "hemoglobin",
      rawName: "Haemoglobin",
      value: 10,
      unit: "g/dL",
      status: "risk",
      calibratedLow: 13,
      calibratedHigh: 17,
    }),
    stored({
      markerKey: "tsh",
      value: 2,
      unit: "uIU/mL",
      status: "optimal",
      calibratedLow: 0.5,
      calibratedHigh: 2.5,
    }),
    stored({
      markerKey: "glucose_fasting",
      value: 105,
      unit: "mg/dL",
      status: "watch",
      calibratedLow: 70,
      calibratedHigh: 99,
    }),
    stored({
      markerKey: "tc_hdl_ratio",
      value: 3.5,
      unit: "ratio",
      status: "optimal",
      calibratedHigh: 4.5,
      derived: true,
    }),
    stored({ rawName: "HBsAg", valueText: "Non Reactive" }),
  );
  store.followUpRows.push(
    {
      kind: "retest",
      markerKey: "hemoglobin",
      title: "Retest",
      why: "Low",
      nextAction: "Book",
      rank: 1,
    },
    {
      kind: "measure",
      markerKey: "lipoprotein_a",
      title: "Measure",
      why: "Missing",
      nextAction: "Ask",
      rank: 2,
    },
  );

  const detail = await (await call("GET", `/reports/${body.id}`)).json();

  expect(detail).toMatchObject({
    header: {
      coverage: { measured: 3, core: 16 },
      capped: true,
      formula: expect.stringMatching(/weighted mean/),
    },
    moveFirst: [
      { markerKey: "hemoglobin", severity: "critical", deviation: -0.75 },
      { markerKey: "glucose_fasting", severity: "out_of_optimal" },
    ],
    categories: [
      { key: "metabolic", markers: [{ markerKey: "glucose_fasting" }] },
      { key: "thyroid", markers: [{ markerKey: "tsh", status: "optimal", deviation: 0 }] },
      {
        key: "blood_count",
        markers: [
          {
            markerKey: "hemoglobin",
            description: expect.stringMatching(/\w/),
            value: 10,
            labRange: null,
            calibratedRange: { low: 13, high: 17 },
          },
        ],
      },
    ],
    derived: [{ markerKey: "tc_hdl_ratio", name: "Total cholesterol to HDL ratio" }],
    unmapped: [{ rawName: "HBsAg", valueText: "Non Reactive" }],
    followUps: [{ kind: "retest", next: "Book" }, { kind: "measure" }],
    unmeasured: [{ markerKey: "lipoprotein_a" }],
  });
});

test("a marker page returns the row, its South Asian watch band and source, history, copy, follow-ups and neighbours", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  const ldl = { markerKey: "ldl_cholesterol", unit: "mg/dL", calibratedHigh: 99 };
  store.markerRows.push(
    stored({ markerKey: "glucose_fasting", value: 90, unit: "mg/dL", status: "optimal" }),
    stored({ ...ldl, value: 140, status: "risk" }),
    stored({ markerKey: "tsh", value: 2, unit: "uIU/mL", status: "optimal" }),
  );
  store.followUpRows.push(
    {
      kind: "retest",
      markerKey: "ldl_cholesterol",
      title: "Retest LDL",
      why: "",
      nextAction: "",
      rank: 1,
    },
    { kind: "retest", markerKey: "tsh", title: "Retest TSH", why: "", nextAction: "", rank: 2 },
  );
  const earlier = "6f9c1d2e-0b7a-4c55-8f3e-1a2b3c4d5e6f";
  const createdAt = new Date("2026-01-01T00:00:00Z");
  store.historyRows.push(
    {
      reportId: earlier,
      collectedAt: "2025-06-01",
      createdAt,
      value: 3.1,
      unit: "mmol/L",
      status: null,
    },
    {
      reportId: earlier,
      collectedAt: "2025-06-01",
      createdAt,
      value: 120,
      unit: "mg/dL",
      status: "watch",
    },
    {
      reportId: body.id,
      collectedAt: "2026-03-01",
      createdAt,
      value: 140,
      unit: "mg/dL",
      status: "risk",
    },
  );

  const res = await call("GET", `/reports/${body.id}/markers/ldl_cholesterol`);

  expect(await res.json()).toMatchObject({
    profile: { ancestry: "south_asian", sex: "male" },
    marker: {
      markerKey: "ldl_cholesterol",
      value: 140,
      status: "risk",
      deviation: expect.any(Number),
    },
    watchRange: { low: null, high: 129 },
    calibratedSource: { id: "lai2023" },
    history: [
      { reportId: earlier, value: 120, status: "watch" },
      { reportId: body.id, value: 140, status: "risk" },
    ],
    knowledge: { whatItIs: expect.stringMatching(/LDL/) },
    southAsianNote: expect.stringMatching(/Lipid Association of India/),
    sources: expect.arrayContaining([expect.objectContaining({ id: "lai2023" })]),
    followUps: [{ title: "Retest LDL" }],
    previous: { markerKey: "glucose_fasting" },
    next: { markerKey: "tsh" },
  });
});

test("a marker that is not in the report, or a report of another user, returns 404", async () => {
  const { body } = await create([pdf]);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "done";
  store.markerRows.push(stored({ markerKey: "tsh", value: 2, unit: "uIU/mL", status: "optimal" }));
  expect((await call("GET", `/reports/${body.id}/markers/ldl_cholesterol`)).status).toBe(404);
  expect((await call("GET", `/reports/${body.id}/markers/tsh`, "bob")).status).toBe(404);
  expect((await call("GET", `/reports/${body.id}/markers/TSH`)).status).toBe(400);
});

test("retrying a failed report queues it again, and any other status returns 409", async () => {
  const { body } = await create([pdf]);
  expect((await call("POST", `/reports/${body.id}/retry`)).status).toBe(409);
  const report = store.reports.find((r) => r.id === body.id);
  if (report) report.status = "failed";
  expect((await call("POST", `/reports/${body.id}/retry`, "bob")).status).toBe(404);
  const res = await call("POST", `/reports/${body.id}/retry`);
  expect(await res.json()).toMatchObject({ id: body.id, status: "queued" });
  expect(store.jobs).toEqual([body.id]);
});

test("a user with no free credit gets 402, and drafts in flight hold their credit", async () => {
  store.credits.set("alice", { balance: 2, readsToday: 0 });
  expect((await create([pdf])).res.status).toBe(201);
  expect((await create([pdf])).res.status).toBe(201);
  const { res, body } = await create([pdf]);
  expect(res.status).toBe(402);
  expect(body).toMatchObject({ status: 402, title: "You have no report credits left." });
  expect(store.reports).toHaveLength(2);
});

test("the sixth read in one day returns 429", async () => {
  store.credits.set("alice", { balance: 50, readsToday: 4 });
  expect((await create([pdf])).res.status).toBe(201);
  expect((await create([pdf])).res.status).toBe(429);
});

test("with CLAUDE_HARD_STOP every new report returns 503", async () => {
  env.CLAUDE_HARD_STOP = true;
  expect((await create([pdf])).res.status).toBe(503);
  expect(store.reports).toEqual([]);
});
