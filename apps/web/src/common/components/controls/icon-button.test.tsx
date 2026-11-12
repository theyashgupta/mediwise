/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { Share } from "lucide-react";
import { afterEach, expect, test } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { IconButton } from "./icon-button";

afterEach(cleanup);

test("the label is the accessible name of the icon button", () => {
  render(
    <TooltipProvider>
      <IconButton label="Share this report">
        <Share aria-hidden />
      </IconButton>
    </TooltipProvider>,
  );
  expect(screen.getByRole("button", { name: "Share this report" })).toBeTruthy();
});

test("an icon button with asChild renders its link with the label as the name", () => {
  render(
    <TooltipProvider>
      <IconButton asChild label="Open the year review">
        <a href="/year-review">
          <Share aria-hidden />
        </a>
      </IconButton>
    </TooltipProvider>,
  );
  const link = screen.getByRole("link", { name: "Open the year review" });
  expect(link.getAttribute("href")).toBe("/year-review");
  expect(screen.queryByRole("button")).toBeNull();
});

/** Compiles only while `label` stays required, so an unnamed icon button fails the typecheck. */
export function unnamedIconButton() {
  return (
    // @ts-expect-error label is required
    <IconButton>
      <Share aria-hidden />
    </IconButton>
  );
}
