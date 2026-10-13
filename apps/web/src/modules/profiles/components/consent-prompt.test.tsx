import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import { ConsentPrompt } from "./consent-prompt";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: string }) => <a href="/profiles">{children}</a>,
}));

function render(permissionNames: string[], guardianNames: string[]) {
  return renderToStaticMarkup(
    <ConsentPrompt
      permissionNames={permissionNames}
      guardianNames={guardianNames}
      confirming={false}
      onConfirm={() => {}}
    />,
  );
}

test("the prompt names every profile that waits for a tick and starts with Confirm disabled", () => {
  const html = render(["Asha", "Ravi"], ["Meera"]);
  expect(html).toContain("I have the permission of Asha and Ravi to add their reports.");
  expect(html).toContain("I am the parent or guardian of Meera.");
  expect(html).toMatch(/<button[^>]*disabled/);
});

test("the prompt shows no guardian line when no child profile waits for one", () => {
  expect(render(["Asha"], [])).not.toContain("guardian");
});
