import type { ProfileInput, ProfileUpdate } from "@mediwise/shared";
import { Hono } from "hono";
import { beforeEach, expect, test, vi } from "vitest";
import { handleError } from "../../common/problem.js";
import type { AuthEnv } from "../../middleware/auth.js";
import { profilesRoutes } from "./profiles.routes.js";

const store = vi.hoisted(() => {
  type Row = {
    id: string;
    ownerUserId: string;
    name: string;
    relation: string;
    dateOfBirth: string | null;
    dateOfBirthApproximate: boolean;
    sex: string | null;
    ancestry: string;
    isSelf: boolean;
  };
  const rows: Row[] = [];
  const exportRows: { markerRows: object[]; studyRows: object[]; measurementRows: object[] } = {
    markerRows: [],
    studyRows: [],
    measurementRows: [],
  };
  const owned = (owner: string) => rows.filter((row) => row.ownerUserId === owner);
  const find = (owner: string, id: string) => owned(owner).find((row) => row.id === id);
  return {
    rows,
    exportRows,
    repo: {
      listExportRows: async () => exportRows,
      listProfilesByOwner: async (owner: string) =>
        owned(owner)
          .sort((a, b) => Number(b.isSelf) - Number(a.isSelf))
          .map((row) => ({ ...row, reportCount: 0 })),
      findProfileById: async (owner: string, id: string) => find(owner, id),
      countProfilesByOwner: async (owner: string) => owned(owner).length,
      insertProfile: async (owner: string, input: ProfileInput) => {
        const row = {
          ...input,
          dateOfBirthApproximate: false,
          id: crypto.randomUUID(),
          ownerUserId: owner,
          isSelf: false,
        };
        rows.push(row);
        return row;
      },
      insertSelfProfileIfMissing: async (owner: string, name: string) => {
        if (owned(owner).some((row) => row.isSelf)) return;
        rows.push({
          id: crypto.randomUUID(),
          ownerUserId: owner,
          name,
          relation: "self",
          dateOfBirth: null,
          dateOfBirthApproximate: false,
          sex: null,
          ancestry: "unknown",
          isSelf: true,
        });
      },
      updateProfile: async (
        owner: string,
        id: string,
        input: ProfileUpdate & { dateOfBirthApproximate?: boolean },
      ) => {
        const row = find(owner, id);
        return row && Object.assign(row, input);
      },
      deleteProfile: async (owner: string, id: string) => {
        const row = find(owner, id);
        if (row) rows.splice(rows.indexOf(row), 1);
      },
    },
  };
});

vi.mock("./profiles.repo.js", () => store.repo);

const app = new Hono<AuthEnv>()
  .use(async (c, next) => {
    c.set("userId", c.req.header("x-user") ?? "alice");
    c.set("email", `${c.var.userId}@example.com`);
    await next();
  })
  .route("/profiles", profilesRoutes);
app.onError(handleError);

const member = {
  name: "Asha",
  relation: "parent",
  dateOfBirth: "1960-02-29",
  sex: "female",
  ancestry: "south_asian",
};

function call(method: string, path: string, user = "alice", body?: object) {
  return app.request(path, {
    method,
    headers: { "x-user": user, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
  });
}

async function createMember(user = "alice") {
  const res = await call("POST", "/profiles", user, member);
  return (await res.json()) as { id: string };
}

beforeEach(() => {
  store.rows.length = 0;
  store.exportRows.markerRows = [];
  store.exportRows.studyRows = [];
  store.exportRows.measurementRows = [];
});

test("GET /profiles creates the self profile on the first call", async () => {
  const res = await call("GET", "/profiles");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual([
    expect.objectContaining({ name: "alice", relation: "self", isSelf: true, dateOfBirth: null }),
  ]);
});

test("a created family member is listed after the self profile", async () => {
  await call("GET", "/profiles");
  const res = await call("POST", "/profiles", "alice", member);
  expect(res.status).toBe(201);
  const list = (await (await call("GET", "/profiles")).json()) as { name: string }[];
  expect(list.map((profile) => profile.name)).toEqual(["alice", "Asha"]);
});

test("a profile of another user returns 404 on update and delete", async () => {
  const { id } = await createMember("alice");
  expect((await call("PATCH", `/profiles/${id}`, "bob", { name: "Mallory" })).status).toBe(404);
  expect((await call("DELETE", `/profiles/${id}`, "bob")).status).toBe(404);
  const bobList = (await (await call("GET", "/profiles", "bob")).json()) as { id: string }[];
  expect(bobList.map((profile) => profile.id)).not.toContain(id);
  expect(store.rows.find((row) => row.id === id)?.name).toBe("Asha");
});

test("the ninth profile returns 409", async () => {
  await call("GET", "/profiles");
  for (let i = 0; i < 7; i++)
    expect((await call("POST", "/profiles", "alice", member)).status).toBe(201);
  const res = await call("POST", "/profiles", "alice", member);
  expect(res.status).toBe(409);
  expect(await res.json()).toMatchObject({ title: "You can have up to 8 profiles" });
});

test("the self profile cannot be removed", async () => {
  const [self] = (await (await call("GET", "/profiles")).json()) as { id: string }[];
  expect((await call("DELETE", `/profiles/${self?.id}`)).status).toBe(409);
});

test("a second self profile cannot be created", async () => {
  expect((await call("POST", "/profiles", "alice", { ...member, relation: "self" })).status).toBe(
    409,
  );
});

test("a family member is updated and removed", async () => {
  const { id } = await createMember();
  const res = await call("PATCH", `/profiles/${id}`, "alice", { name: "Asha Rao" });
  expect(await res.json()).toMatchObject({ name: "Asha Rao", relation: "parent" });
  expect((await call("DELETE", `/profiles/${id}`)).status).toBe(204);
  expect((await call("PATCH", `/profiles/${id}`, "alice", { name: "x" })).status).toBe(404);
});

test("saving a date of birth clears the approximate flag, other changes keep it", async () => {
  const { id } = await createMember();
  const row = store.rows.find((profile) => profile.id === id)!;
  row.dateOfBirthApproximate = true;

  const renamed = await call("PATCH", `/profiles/${id}`, "alice", { name: "Asha Rao" });
  expect(await renamed.json()).toMatchObject({ dateOfBirthApproximate: true });

  const dated = await call("PATCH", `/profiles/${id}`, "alice", { dateOfBirth: "1960-03-01" });
  expect(await dated.json()).toMatchObject({
    dateOfBirth: "1960-03-01",
    dateOfBirthApproximate: false,
  });
});

test("an invalid body returns a 400 problem", async () => {
  const res = await call("POST", "/profiles", "alice", { ...member, dateOfBirth: "29/02/1960" });
  expect(res.status).toBe(400);
});

const csvHeader =
  "Type,Report date,Lab,Marker key,Marker name,Value,Unit,Status,Printed range,Calibrated range,Visit ID,Report ID";
const report = {
  reportId: "r1",
  reportDate: "2025-02-14",
  collectedAt: "2025-02-14",
  labName: 'Made-up Labs, "North" branch',
};

test("an empty profile downloads a CSV with the BOM and the header row only", async () => {
  const { id } = await createMember();
  const res = await call("GET", `/profiles/${id}/export.csv`);
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
  const bytes = new Uint8Array(await res.arrayBuffer());
  expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes)).toBe(
    `\uFEFF${csvHeader}\r\n`,
  );
});

test("the CSV quotes a lab name with a comma and quotes, and types vitals and studies", async () => {
  const { id } = await createMember();
  store.exportRows.markerRows = [
    {
      ...report,
      markerKey: "ldl_cholesterol",
      rawName: "LDL Cholesterol",
      value: 131,
      valueText: null,
      unit: "mg/dL",
      status: "watch",
      labRangeLow: null,
      labRangeHigh: 130,
      calibratedLow: 50,
      calibratedHigh: 100,
    },
    {
      ...report,
      markerKey: "systolic_bp",
      rawName: "Systolic",
      value: 128,
      valueText: null,
      unit: "mmHg",
      status: "optimal",
      labRangeLow: null,
      labRangeHigh: null,
      calibratedLow: null,
      calibratedHigh: null,
    },
  ];
  store.exportRows.studyRows = [
    {
      ...report,
      kind: "xray",
      bodyRegion: "Chest",
      impressionText: "=No active lesion",
      resultText: null,
      findingsText: null,
    },
  ];
  const text = await (await call("GET", `/profiles/${id}/export.csv`)).text();
  const lab = '"Made-up Labs, ""North"" branch"';
  expect(text.split("\r\n")).toEqual([
    csvHeader,
    `marker,2025-02-14,${lab},ldl_cholesterol,LDL cholesterol,131,mg/dL,watch,< 130,50 to 100,visit-2025-02-14,r1`,
    `vital,2025-02-14,${lab},systolic_bp,Systolic blood pressure,128,mmHg,optimal,,,visit-2025-02-14,r1`,
    `study,2025-02-14,${lab},xray,Chest,'=No active lesion,,,,,visit-2025-02-14,r1`,
    "",
  ]);
});

test("another user's profile export returns 404", async () => {
  const { id } = await createMember("alice");
  expect((await call("GET", `/profiles/${id}/export.csv`, "bob")).status).toBe(404);
});
