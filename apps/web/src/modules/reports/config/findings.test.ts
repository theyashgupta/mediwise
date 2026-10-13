import { expect, test } from "vitest";
import type { ReportDetail } from "../types";
import { findingChips } from "./findings";

const report = {
  categories: [{ markers: [{ markerKey: "tsh", name: "Thyroid stimulating hormone" }] }],
  derived: [{ markerKey: "tc_hdl_ratio", name: "Total cholesterol to HDL ratio" }],
  studies: [{ id: "study-1", kind: "ultrasound", bodyRegion: "Abdomen and pelvis" }],
} as unknown as Pick<ReportDetail, "categories" | "derived" | "studies">;

test("a finding's chips name its markers and studies from the report", () => {
  expect(
    findingChips({ citedKeys: ["tsh", "tc_hdl_ratio"], citedStudyIds: ["study-1"] }, report),
  ).toEqual({
    markers: [
      { key: "tsh", name: "Thyroid stimulating hormone" },
      { key: "tc_hdl_ratio", name: "Total cholesterol to HDL ratio" },
    ],
    studies: [{ id: "study-1", title: "Ultrasound, Abdomen and pelvis" }],
  });
});

test("a citation the report cannot name gets no chip", () => {
  expect(findingChips({ citedKeys: ["ldl_cholesterol"], citedStudyIds: ["gone"] }, report)).toEqual(
    { markers: [], studies: [] },
  );
});
