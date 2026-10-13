import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { supabase } from "@/lib/supabase";
import { routeTree } from "@/routeTree.gen";

const token = "a".repeat(43);

const shared = {
  expiresAt: "2026-10-20T06:00:00.000Z",
  person: { firstName: "Arjun", age: 36 },
  report: {
    header: { labName: "Made-up Labs", collectedAt: "2026-09-01", reportedAt: null },
    moveFirst: [],
    patterns: [],
    findings: [],
    settled: [],
    doctorQuestions: ["Should I repeat the HbA1c test in three months?"],
    categories: [],
    derived: [],
    unmapped: [],
    studies: [],
    files: { images: [] },
  },
  previous: null,
};

async function renderSharePage(seed: (client: QueryClient) => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  seed(queryClient);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [`/share/${token}`] }),
  });
  await router.load();
  return renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

test("the shared page renders the export without a session", async () => {
  expect((await supabase.auth.getSession()).data.session).toBeNull();

  const html = await renderSharePage((client) =>
    client.setQueryData(["reports", "shared", token], shared),
  );

  expect(html).toContain('<meta name="robots" content="noindex, nofollow"/>');
  expect(html).toContain('data-theme="light"');
  expect(html).toContain("This link ends on 20 Oct 2026.");
  expect(html).toContain("Arjun");
  expect(html).toContain("36 years");
  expect(html).not.toContain("Date of birth");
  expect(html).toContain("Should I repeat the HbA1c test in three months?");
  expect(html).toContain("It does not replace a doctor.");
  expect(html).not.toContain("<nav");
});
