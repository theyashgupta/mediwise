import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";
import { denseHistoryReports, insertDenseHistory } from "../../db/dense-history.js";
import { getSuggestions } from "./suggestions.service.js";

const dense = denseHistoryReports("2026-10-13");

test("the dense history gives one doctor-soon list first, then supplement asks and grouped habits, all with the disclaimer", async () => {
  const userId = randomUUID();
  const { profileId } = await insertDenseHistory(userId, dense);

  const { suggestions } = await getSuggestions(userId, profileId, "en");

  expect(suggestions[0]).toMatchObject({ kind: "doctor_soon", rank: 1 });
  expect(suggestions[0]?.markerKeys).toContain("vitamin_b12");
  expect(
    suggestions.filter(({ kind }) => kind === "supplement_ask").map(({ markerKeys }) => markerKeys),
  ).toEqual([["vitamin_b12"], ["ferritin"]]);
  const habitKeys = suggestions
    .filter(({ kind }) => kind === "habit")
    .flatMap(({ markerKeys }) => markerKeys);
  expect(new Set(habitKeys).size).toBe(habitKeys.length);
  expect(new Set(suggestions.map(({ disclaimer }) => disclaimer))).toEqual(
    new Set(["MediWise is for information. Ask your doctor before you act on this."]),
  );
});

test("a profile of another owner is not found", async () => {
  const { profileId } = await insertDenseHistory(randomUUID(), dense);

  await expect(getSuggestions(randomUUID(), profileId, "en")).rejects.toMatchObject({
    status: 404,
  });
});
