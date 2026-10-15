import { expect, test } from "vitest";
import { checkedLabName, printedHeader } from "./extraction.header.js";

const labA = [
  "Patient ID           : 290325008                                                           Registration Time     : 01-Feb-2025 09:00 AM",
  "Patient Name         : Mr. Arjun Mehta                                                      Collection Time       : 01-Feb-2025 09:00 AM",
  "Ref. By Doctor       : CARE PLUS                                                         Sample No             *290325008*",
  "                                                Care Plus (Acme Insure - Package 5)",
  "  Test Name                                            Result                    Unit                   Bio.Ref.Range",
].join("\n");
const lakeview2024 = [
  "                                                         Laboratory Investigation Report",
  " Patient Name            : Mr. Arjun Mehta                                        Centre              : 0412 - Home Collection North",
  " Ref Doctor              : Self                                                  Reporting Date/Time : 14/Jan/2024 08:17AM",
].join("\n");
const usg = [
  " Patient Name           :   Mr. Arjun Mehta                         Date: 01 Feb 2025",
  " Referred By            :   GF Greenfield Health & Diagnostic          Age: 31 YEARS Sex: M",
].join("\n");
const textLetterhead = [
  "   Sunrise Diagnostics Pvt Ltd                     NABL accredited",
  "   12 MG Road, Pune",
  " Patient Name : Asha Verma        Ref. By : Dr. R. Shah",
].join("\n");

const usBoxes = [
  "Northfield Clinical Laboratories",
  "Patient Information              Specimen Information             Client Information",
  "DOE, JANE                        Specimen: NF123456A              Ordering Physician: SAMPLE, ALEX MD",
  "DOB: 04/09/1979   Age: 46        Collected: 03/04/2025 / 08:15 EST",
].join("\n");
const usLogo = usBoxes.split("\n").slice(1).join("\n");
const nhsApp = [
  "Test results",
  "GP health record",
  "Haemoglobin A1c level                 Date: 14/03/2025",
].join("\n");

test.each([
  [
    "a US report with three header boxes",
    usBoxes,
    { referredBy: "SAMPLE, ALEX MD", letterhead: "Northfield Clinical Laboratories" },
  ],
  [
    "a US report with a logo letterhead",
    usLogo,
    { referredBy: "SAMPLE, ALEX MD", letterhead: undefined },
  ],
  ["an NHS App screen", nhsApp, { referredBy: undefined, letterhead: undefined }],
  ["lab-a", labA, { referredBy: "CARE PLUS", letterhead: undefined }],
  ["the 2024 sample", lakeview2024, { referredBy: "Self", letterhead: undefined }],
  ["usg", usg, { referredBy: "GF Greenfield Health & Diagnostic", letterhead: undefined }],
  [
    "a text letterhead",
    textLetterhead,
    { referredBy: "Dr. R. Shah", letterhead: "Sunrise Diagnostics Pvt Ltd" },
  ],
])("the page 1 header of %s gives %j", (_, page, header) => {
  expect(printedHeader(page)).toEqual(header);
});

test.each([
  ["a doctor", { labName: "Dr.Kiran Joshi" }, labA, undefined],
  ["the referrer", { labName: "CARE PLUS", referredBy: "CARE PLUS" }, labA, undefined],
  ["the printed referrer", { labName: "Care  plus" }, labA, undefined],
  [
    "the package",
    {
      labName: "Care Plus (Acme Insure - Package 5)",
      packageName: "Care Plus (Acme Insure - Package 5)",
    },
    labA,
    undefined,
  ],
  ["a patient", { labName: "Mr. Arjun Mehta" }, textLetterhead, "Sunrise Diagnostics Pvt Ltd"],
  ["the laboratory", { labName: "Lakeview Lab" }, lakeview2024, "Lakeview Lab"],
  ["a US box title", { labName: "Client Information" }, usLogo, undefined],
  ["missing on an NHS App screen", {}, nhsApp, undefined],
  [
    "a lab whose name starts with Dr letters",
    { labName: "Drishti Diagnostics" },
    undefined,
    "Drishti Diagnostics",
  ],
])("a lab name that is %s gives %j", (_, fields, firstPage, labName) => {
  expect(checkedLabName(fields, firstPage)).toBe(labName);
});

test("a lab whose letterhead says Results is still the letterhead", () => {
  const page = [
    "Results Pathology Lab",
    " Patient Name : Asha Verma        Ref. By : Dr. R. Shah",
  ].join("\n");
  expect(printedHeader(page).letterhead).toBe("Results Pathology Lab");
});
