import { createRouter } from "@tanstack/react-router";
import { syncLocale } from "@/common/hooks/use-locale";
import { queryClient } from "@/config/query-client";
import { supabase } from "@/lib/supabase";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({ routeTree, scrollRestoration: true });

supabase.auth.onAuthStateChange((event, session) => {
  if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) void syncLocale(session);
  if (event !== "SIGNED_OUT") return;
  void router.navigate({ to: "/login" }).then(() => queryClient.clear());
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
