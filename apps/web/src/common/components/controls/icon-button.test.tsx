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

/** Compiles only while `label` stays required, so an unnamed icon button fails the typecheck. */
export function unnamedIconButton() {
  return (
    // @ts-expect-error label is required
    <IconButton>
      <Share aria-hidden />
    </IconButton>
  );
}
