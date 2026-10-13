import { describe, expect, test } from "vitest";
import {
  categories,
  categorySchema,
  coreMarkerKeys,
  derived,
  derivedSchema,
  findMarker,
  markerSchema,
  markers,
  normalizeName,
  sourceSchema,
  sources,
  studyMarkers,
  type Marker,
  type Range,
} from "./index.js";

const entries: Marker[] = [...markers, ...derived];
const allEntries: Marker[] = [...entries, ...studyMarkers];
const sourceList = Object.values(sources);

function sentences(text: string): string[] {
  return text.split(/[.!?](?=\s|$)/).filter((part) => part.trim());
}

function sentenceCount(text: string): number {
  return sentences(text).length;
}

function sameFilter(a: Range, b: Range): boolean {
  return a.sex === b.sex && a.ancestry === b.ancestry;
}

function agesOverlap(a: Range, b: Range): boolean {
  return (a.ageMin ?? 0) < (b.ageMax ?? Infinity) && (b.ageMin ?? 0) < (a.ageMax ?? Infinity);
}

describe("catalog size", () => {
  test("the catalog has at least 120 markers, 8 derived markers and 25 sources", () => {
    expect(markers.length).toBeGreaterThanOrEqual(120);
    expect(derived.length).toBeGreaterThanOrEqual(8);
    expect(sourceList.length).toBeGreaterThanOrEqual(25);
  });

  test("the core set has 16 markers", () => {
    expect(coreMarkerKeys).toHaveLength(16);
  });
});

describe("schema", () => {
  test.each(markers.map((marker) => [marker.key, marker]))(
    "marker %s matches the schema",
    (_, marker) => {
      expect(markerSchema.safeParse(marker).error).toBeUndefined();
    },
  );

  test.each(studyMarkers.map((entry) => [entry.key, entry]))(
    "study measurement %s matches the schema and sits in the studies category",
    (_, entry) => {
      expect(markerSchema.safeParse(entry).error).toBeUndefined();
      expect(entry.category).toBe("studies");
    },
  );

  test.each(derived.map((entry) => [entry.key, entry]))(
    "derived %s matches the schema",
    (_, entry) => {
      expect(derivedSchema.safeParse(entry).error).toBeUndefined();
    },
  );

  test("every source matches the schema and is stored under its own id", () => {
    for (const [key, source] of Object.entries(sources)) {
      expect(sourceSchema.safeParse(source).error).toBeUndefined();
      expect(source.id).toBe(key);
    }
  });
});

describe("keys and aliases", () => {
  test("keys are unique across markers and derived markers", () => {
    const keys = allEntries.map((entry) => entry.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("no name, short name or alias resolves to two different markers", () => {
    const owner = new Map<string, string>();
    const clashes: string[] = [];
    for (const entry of entries) {
      for (const term of [entry.name, entry.shortName ?? "", ...entry.aliases]) {
        const normalized = normalizeName(term);
        if (!normalized) continue;
        const existing = owner.get(normalized);
        if (existing && existing !== entry.key)
          clashes.push(`${normalized}: ${existing}, ${entry.key}`);
        owner.set(normalized, entry.key);
      }
    }
    expect(clashes).toEqual([]);
  });

  test("aliases are stored already normalised", () => {
    const unnormalised = entries.flatMap((entry) =>
      entry.aliases
        .filter((alias) => alias !== normalizeName(alias))
        .map((alias) => `${entry.key}: ${alias}`),
    );
    expect(unnormalised).toEqual([]);
  });

  test("markers average at least 3 aliases", () => {
    const total = markers.reduce((sum, marker) => sum + marker.aliases.length, 0);
    expect(total / markers.length).toBeGreaterThanOrEqual(3);
  });

  test("every marker resolves through findMarker by its name and each alias", () => {
    const misses = entries.flatMap((entry) =>
      [entry.name, ...entry.aliases]
        .filter((term) => findMarker(term)?.key !== entry.key)
        .map((term) => `${entry.key}: ${term}`),
    );
    expect(misses).toEqual([]);
  });
});

describe("ranges and sources", () => {
  test("every range cites a source listed on its marker, and every marker source is in the source list", () => {
    for (const entry of allEntries) {
      const ids = entry.sources.map((source) => source.id);
      for (const range of entry.ranges) expect(ids, entry.key).toContain(range.source);
      for (const source of entry.sources)
        expect(sources[source.id as keyof typeof sources]).toBe(source);
    }
  });

  test("every retest interval cites a source listed on its marker, once per status", () => {
    for (const entry of allEntries) {
      const ids = entry.sources.map((source) => source.id);
      const retest = entry.retest ?? [];
      for (const item of retest) {
        expect(sources[item.source as keyof typeof sources], entry.key).toBeDefined();
        expect(ids, entry.key).toContain(item.source);
      }
      expect(new Set(retest.map((item) => item.status)).size, entry.key).toBe(retest.length);
    }
  });

  test("only HbA1c, eGFR and urine ACR carry a retest interval", () => {
    const keys = allEntries.filter((entry) => entry.retest).map((entry) => entry.key);
    expect(keys.sort()).toEqual(["egfr", "hba1c", "urine_acr"]);
  });

  test("no two ranges of a marker apply to the same profile", () => {
    for (const entry of allEntries) {
      entry.ranges.forEach((a, i) =>
        entry.ranges.slice(i + 1).forEach((b) => {
          expect(sameFilter(a, b) && agesOverlap(a, b), entry.key).toBe(false);
        }),
      );
    }
  });

  test("a lab marker without ranges takes text results only", () => {
    const lab = entries.filter((entry) => entry.category !== "vitals");
    const keys = lab.filter((entry) => entry.ranges.length === 0).map((entry) => entry.key);
    const textKeys = lab.filter((entry) => entry.unit === "text").map((entry) => entry.key);
    expect(keys).toEqual(textKeys);
  });

  test("every urine category key starts with urine_, so a urine panel can find it", () => {
    const urine = entries.filter((entry) => entry.category === "urine");
    expect(urine.filter((entry) => !entry.key.startsWith("urine_"))).toEqual([]);
  });

  test("every risk text rule, and every other text rule with a follow-up, has short sentences that name its marker", () => {
    const rules = entries.flatMap((entry) =>
      (entry.textRules ?? []).map((rule) => ({ entry, rule })),
    );
    const checked = rules.filter(({ rule }) => rule.status === "risk" || rule.followUp);
    expect(checked.map(({ rule }) => rule.status)).toEqual(
      expect.arrayContaining(["risk", "watch"]),
    );
    for (const { entry, rule } of checked) {
      const { title, why, next } = rule.followUp ?? { title: "", why: "", next: "" };
      expect(`${title} ${why}`).toContain(entry.shortName ?? entry.name);
      for (const text of [title, why, next]) {
        expect(text).not.toMatch(/;|calibrated/);
        for (const sentence of text.split(/[.!?](?=\s|$)/).filter((part) => part.trim())) {
          expect(sentence.trim().split(/\s+/).length).toBeLessThanOrEqual(20);
        }
      }
    }
  });

  test("a one-sided direction leaves the other side of every range open", () => {
    for (const entry of allEntries) {
      const side = { high_is_bad: 0, low_is_bad: 1, both: undefined }[entry.direction];
      if (side === undefined) continue;
      for (const range of entry.ranges) {
        expect([range.optimal[side], range.watch[side]], entry.key).toEqual([null, null]);
      }
    }
  });
});

describe("copy", () => {
  test("every copy field is filled, and none says unknown or TBD", () => {
    for (const entry of allEntries) {
      const copy = [
        entry.description,
        entry.whatItIs,
        entry.whyItMatters,
        entry.whatMovesIt,
        entry.southAsianNote ?? "x",
      ];
      for (const text of copy) {
        expect(text.trim(), entry.key).not.toBe("");
        expect(text, entry.key).not.toMatch(/\bunknown\b|\btbd\b/i);
      }
    }
  });

  test("descriptions are one line under 90 characters, long fields are 2 to 3 sentences", () => {
    const problems: string[] = [];
    for (const entry of allEntries) {
      if (entry.description.length >= 90 || entry.description.includes("\n")) {
        problems.push(`${entry.key}: description`);
      }
      for (const text of [entry.whatItIs, entry.whyItMatters, entry.whatMovesIt]) {
        const count = sentenceCount(text);
        if (count < 2 || count > 3) problems.push(`${entry.key}: ${text}`);
      }
      if (entry.southAsianNote && sentenceCount(entry.southAsianNote) > 3) {
        problems.push(`${entry.key}: southAsianNote`);
      }
    }
    expect(problems).toEqual([]);
  });

  test("copy fields have no semicolon and no sentence over 20 words", () => {
    const problems: string[] = [];
    for (const entry of allEntries) {
      const copy = [
        entry.description,
        entry.whatItIs,
        entry.whyItMatters,
        entry.whatMovesIt,
        entry.southAsianNote ?? "",
      ];
      for (const text of copy) {
        const long = sentences(text).filter((part) => part.trim().split(/\s+/).length > 20);
        if (text.includes(";") || long.length > 0) problems.push(`${entry.key}: ${text}`);
      }
    }
    expect(problems).toEqual([]);
  });
});

describe("derived formulas and categories", () => {
  test("every derived formula reads only marker keys that exist", () => {
    const keys = new Set(entries.map((entry) => entry.key));
    for (const entry of derived) {
      const { kind, ...inputs } = entry.formula;
      const refs = Object.values(inputs).filter((value) => typeof value === "string");
      if (kind === "homa_ir") refs.push("glucose_fasting", "insulin_fasting");
      if (kind === "ckd_epi_2021") refs.push("creatinine");
      if (kind === "bmi") refs.push("weight", "height");
      for (const ref of refs) expect(keys, entry.key).toContain(ref);
    }
  });

  test("categories list every category exactly once", () => {
    expect(categories.map((category) => category.key).sort()).toEqual(
      [...categorySchema.options].sort(),
    );
  });
});

describe("supplementable", () => {
  test("only vitamin D, B12, folate, iron and ferritin are supplementable", () => {
    const keys = entries.filter((entry) => entry.supplementable).map((entry) => entry.key);
    expect(keys.sort()).toEqual(["ferritin", "folate", "iron", "vitamin_b12", "vitamin_d"]);
  });
});
