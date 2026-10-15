/** @vitest-environment jsdom */
import { policyVersion } from "@mediwise/shared";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { messages } from "@/config/messages";
import {
  fakeNetwork,
  me,
  never,
  problem,
  renderApp,
  resetApp,
  selfProfile,
} from "@/test/render-app";

const t = messages.en.me.consent;

afterEach(resetApp);

type Kind = "terms" | "health_data";

function network(initialMissing: Kind[]) {
  let missing = initialMissing;
  const consents = () => ({ policyVersion, consents: [], missing });
  return fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /me/consents": consents,
    "POST /me/consents": () => {
      missing = [];
      return Response.json(consents(), { status: 201 });
    },
  });
}

const posts = (requests: ReturnType<typeof network>) =>
  requests.filter(({ method, path }) => method === "POST" && path === "/me/consents");

test("a user who never saw the boxes gets both on the upload page and no drop zone until both are ticked", async () => {
  const requests = network(["terms", "health_data"]);
  await renderApp("/reports/upload");

  await screen.findByTestId("consent-gate");
  expect(screen.getByText(t.gateDescription)).toBeTruthy();
  expect(screen.queryByTestId("upload-input")).toBeNull();
  const submit = screen.getByTestId("consent-submit") as HTMLButtonElement;
  expect(submit.disabled).toBe(true);
  expect((screen.getByTestId("consent-terms") as HTMLInputElement).checked).toBe(false);

  await userEvent.click(screen.getByTestId("consent-terms"));
  expect(submit.disabled).toBe(true);
  await userEvent.click(screen.getByTestId("consent-health_data"));
  await userEvent.click(submit);

  await screen.findByTestId("upload-input");
  expect(posts(requests).map(({ body }) => body)).toEqual([{ kinds: ["terms", "health_data"] }]);
});

test("after a policy change only the health data box shows, with the change notice", async () => {
  network(["health_data"]);
  await renderApp("/reports/upload");

  await screen.findByTestId("consent-gate");
  expect(screen.getByText(t.gateChanged)).toBeTruthy();
  expect(screen.queryByTestId("consent-terms")).toBeNull();
  expect(screen.getByTestId("consent-health_data")).toBeTruthy();
});

test("boxes ticked at sign-up for the current version are stored with no second prompt", async () => {
  const requests = network(["terms", "health_data"]);
  await renderApp("/reports/upload", { metadata: { consent_version: policyVersion } });

  await screen.findByTestId("upload-input");
  expect(screen.queryByTestId("consent-gate")).toBeNull();
  expect(posts(requests)).toHaveLength(1);
});

test("boxes ticked at sign-up for an older version do not count", async () => {
  const requests = network(["health_data"]);
  await renderApp("/reports/upload", { metadata: { consent_version: "2026-10-13" } });

  await screen.findByTestId("consent-gate");
  expect(posts(requests)).toHaveLength(0);
});

test("a user with every consent sees the drop zone and sends no consent", async () => {
  const requests = network([]);
  await renderApp("/reports/upload");

  await screen.findByTestId("upload-input");
  await waitFor(() => expect(posts(requests)).toHaveLength(0));
});

const storedRows = [
  {
    kind: "terms",
    policyVersion,
    acceptedAt: "2026-10-15T10:00:00.000Z",
    withdrawnAt: null,
    userAgentHash: null,
  },
  {
    kind: "health_data",
    policyVersion: "2026-10-13",
    acceptedAt: "2026-10-15T10:00:00.000Z",
    withdrawnAt: null,
    userAgentHash: null,
  },
];

test("a user with stored consents gets the gate after a policy change, even when the sign-up version is current", async () => {
  const requests = fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /me/consents": () => ({ policyVersion, consents: storedRows, missing: ["health_data"] }),
  });
  await renderApp("/reports/upload", { metadata: { consent_version: policyVersion } });

  await screen.findByTestId("consent-gate");
  expect(posts(requests)).toHaveLength(0);
});

test("a 403 for health data consent on upload shows the gate, and agreeing sends the upload again", async () => {
  let missing: Kind[] = [];
  let reportPosts = 0;
  const requests = fakeNetwork({
    "GET /me": () => me,
    "GET /profiles": () => [selfProfile],
    "GET /me/consents": () => ({ policyVersion, consents: storedRows, missing }),
    "POST /me/consents": () => {
      missing = [];
      return Response.json({ policyVersion, consents: storedRows, missing }, { status: 201 });
    },
    "POST /reports": () => {
      reportPosts += 1;
      if (reportPosts > 1) return never();
      missing = ["health_data"];
      return problem(403, "Accept the health data consent before MediWise reads a report.");
    },
  });
  await renderApp("/reports/upload", { metadata: { consent_version: policyVersion } });

  await userEvent.upload(
    await screen.findByTestId("upload-input"),
    new File(["%PDF-1.4"], "report.pdf", { type: "application/pdf" }),
  );
  await userEvent.click(screen.getByTestId("upload-submit"));

  await screen.findByTestId("consent-gate");
  expect(posts(requests)).toHaveLength(0);
  await userEvent.click(screen.getByTestId("consent-health_data"));
  await userEvent.click(screen.getByTestId("consent-submit"));

  await waitFor(() => expect(reportPosts).toBe(2));
  expect(posts(requests).map(({ body }) => body)).toEqual([{ kinds: ["health_data"] }]);
});
