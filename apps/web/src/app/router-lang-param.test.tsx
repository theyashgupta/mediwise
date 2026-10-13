/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { afterEach, expect, test, vi } from "vitest";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { messages } from "@/config/messages";
import { resetApp } from "@/test/render-app";

vi.hoisted(() => window.history.replaceState(null, "", "/login?lang=hi&next=%2Freports"));

afterEach(resetApp);

test("a landing link with ?lang=hi opens the sign-in page in Hindi and drops the parameter", async () => {
  render(
    <Providers>
      <RouterProvider router={router} />
    </Providers>,
  );
  await act(() => router.load());

  expect(
    await screen.findByRole("heading", { name: messages.hi.auth.login.title }),
  ).toBeDefined();
  expect(document.documentElement.lang).toBe("hi");
  expect(localStorage.getItem("locale")).toBe("hi");
  expect(window.location.search).toBe("?next=%2Freports");
  expect(router.state.location.search).toEqual({ next: "/reports" });
});
