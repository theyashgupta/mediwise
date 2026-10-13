/** @vitest-environment jsdom */
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { fakeNetwork, never, problem, renderInApp, resetApp } from "@/test/render-app";
import { HealthContainer } from "./health-container";

afterEach(resetApp);

test("the health page shows checking while the API has not answered", async () => {
  fakeNetwork({ "GET /health": never });
  await renderInApp(<HealthContainer />);
  expect(screen.getByText("api: checking")).toBeTruthy();
});

test("the health page shows ok when the API answers", async () => {
  fakeNetwork({ "GET /health": () => ({ status: "ok", time: "2026-10-13T06:00:00Z" }) });
  await renderInApp(<HealthContainer />);
  expect(await screen.findByText("api: ok")).toBeTruthy();
});

test("the health page shows down when the API fails, and check again asks once more", async () => {
  let up = false;
  const requests = fakeNetwork({
    "GET /health": () => (up ? { status: "ok", time: "2026-10-13T06:00:00Z" } : problem(503)),
  });
  await renderInApp(<HealthContainer />);
  expect(await screen.findByText("api: down")).toBeTruthy();

  up = true;
  await userEvent.click(screen.getByRole("button", { name: "Check again" }));

  expect(await screen.findByText("api: ok")).toBeTruthy();
  expect(requests.filter((r) => r.path === "/health")).toHaveLength(2);
});

test("the health page shows down when the network drops", async () => {
  fakeNetwork({});
  await renderInApp(<HealthContainer />);
  expect(await screen.findByText("api: down")).toBeTruthy();
});
