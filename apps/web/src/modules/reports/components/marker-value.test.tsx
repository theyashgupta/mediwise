import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { MarkerValue } from "./marker-value";

const creatinine = { value: 1, valueText: null, unit: "mg/dL", precision: 2 };

test("a value printed in another unit shows the printed value first and the canonical value below", () => {
  const html = renderToStaticMarkup(
    <MarkerValue {...creatinine} printed={{ value: 88.4, unit: "umol/L" }} />,
  );
  expect(html.indexOf("88.4")).toBeLessThan(html.indexOf("umol/L"));
  expect(html.indexOf("umol/L")).toBeLessThan(html.indexOf('data-testid="marker-canonical"'));
  expect(html).toMatch(/data-testid="marker-canonical">1<span[^>]*>mg\/dL<\/span><\/span>/);
});

test("a printed value keeps its decimals although the canonical unit shows none", () => {
  const html = renderToStaticMarkup(
    <MarkerValue
      value={99}
      valueText={null}
      unit="mg/dL"
      precision={0}
      printed={{ value: 5.5, unit: "mmol/L" }}
    />,
  );
  expect(html).toContain("5.5");
  expect(html).toContain(">99<");
});

test("a value in the canonical unit shows one line", () => {
  const html = renderToStaticMarkup(<MarkerValue {...creatinine} printed={null} />);
  expect(html).toContain(">1<");
  expect(html).not.toContain("marker-canonical");
});

test("an eGFR shows the equation the lab printed beside the value", () => {
  const html = renderToStaticMarkup(
    <MarkerValue
      value={92}
      valueText={null}
      unit="mL/min/1.73m²"
      precision={0}
      equation="CKD-EPI 2021"
    />,
  );
  expect(html).toMatch(/92.*mL\/min\/1\.73m².*CKD-EPI 2021/);
});

test("a printed unit with the same number, such as % of total Hgb, shows one line", () => {
  const html = renderToStaticMarkup(
    <MarkerValue
      value={5.9}
      valueText={null}
      unit="%"
      precision={1}
      printed={{ value: 5.9, unit: "% of total Hgb" }}
    />,
  );
  expect(html).toContain("% of total Hgb");
  expect(html).not.toContain("marker-canonical");
});
