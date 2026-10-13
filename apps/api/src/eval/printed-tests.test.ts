import { expect, test } from "vitest";
import { printedTests } from "./printed-tests.js";

test("rows, wrapped names and panels are read from layout text, and method lines and reference tables are not", () => {
  const page = [
    "Patient Name : Mr. Asha Verma        Collection Time : 01-Feb-2025",
    "  URINE ROUTINE",
    "  Protein                 Nil                          Absent",
    "   Sulpho test/ dipstick",
    "  SGOT- Aspartate         22.6        U/L     0 - 40",
    "  Transaminase (AST)",
    "   ENZYMATIC IFCC",
    "  Total Leucocyte Count (TLC) 5980   /uL     4000 -10000",
    "  1 to 4 days        2.7 to 26.5",
    "  Cord blood         2.2 to 10.7",
  ].join("\n");

  expect(printedTests([page])).toEqual([
    { name: "Protein", result: "Nil", panel: "URINE ROUTINE", page: 0 },
    { name: "SGOT- Aspartate Transaminase (AST)", result: "22.6", panel: "URINE ROUTINE", page: 0 },
    { name: "Total Leucocyte Count (TLC)", result: "5980", panel: "URINE ROUTINE", page: 0 },
  ]);
});
