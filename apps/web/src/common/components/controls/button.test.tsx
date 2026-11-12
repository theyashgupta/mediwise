/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { Button } from "./button";

afterEach(cleanup);

test("a loading button is busy, keeps its label as its name and ignores a press", async () => {
  const onClick = vi.fn();
  render(
    <Button loading onClick={onClick}>
      Save profile
    </Button>,
  );
  const button = screen.getByRole("button", { name: "Save profile" });
  await userEvent.click(button);
  expect(onClick).not.toHaveBeenCalled();
  expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.getAttribute("aria-disabled")).toBe("true");
});

test("a button keeps keyboard focus when it starts to load", () => {
  const { rerender } = render(<Button>Save profile</Button>);
  const button = screen.getByRole("button", { name: "Save profile" });
  button.focus();
  rerender(<Button loading>Save profile</Button>);
  expect(button.hasAttribute("disabled")).toBe(false);
  expect(document.activeElement).toBe(button);
});

test("a loading submit button stops a second submit of its form", () => {
  const onSubmit = vi.fn((event: Event) => event.preventDefault());
  render(
    <form onSubmit={(event) => onSubmit(event.nativeEvent)}>
      <Button type="submit" loading>
        Save profile
      </Button>
    </form>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(onSubmit).not.toHaveBeenCalled();
});

test("a button that is not loading runs its handler and is not busy", async () => {
  const onClick = vi.fn();
  render(<Button onClick={onClick}>Save profile</Button>);
  const button = screen.getByRole("button", { name: "Save profile" });
  await userEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  expect(button.getAttribute("aria-busy")).toBeNull();
});

test("a disabled button ignores a press but is not marked busy", async () => {
  const onClick = vi.fn();
  render(
    <Button disabled onClick={onClick}>
      Save profile
    </Button>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(onClick).not.toHaveBeenCalled();
  expect(screen.getByRole("button").getAttribute("aria-busy")).toBeNull();
});

test("asChild renders the child link, and a disabled link is out of the tab order and ignores a press", () => {
  render(
    <Button asChild variant="outline" disabled>
      <a href="/reports">Open reports</a>
    </Button>,
  );
  const link = screen.getByRole("link", { name: "Open reports" });
  expect(screen.queryByRole("button")).toBeNull();
  expect(link.getAttribute("aria-disabled")).toBe("true");
  expect(link.tabIndex).toBe(-1);
  expect(fireEvent.click(link)).toBe(false);
});
