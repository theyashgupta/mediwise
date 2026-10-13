import { createRouter } from "@tanstack/react-router";
import { queryClient } from "@/config/query-client";
import { supabase } from "@/lib/supabase";
import { routeTree } from "@/routeTree.gen";

export const router = createRouter({ routeTree });

supabase.auth.onAuthStateChange((event) => {
  if (event !== "SIGNED_OUT") return;
  void router.navigate({ to: "/login" }).then(() => queryClient.clear());
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
