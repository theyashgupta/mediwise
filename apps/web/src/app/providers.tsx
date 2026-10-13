import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTheme } from "@/common/hooks/use-theme";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/config/query-client";
import { registerServiceWorker } from "./service-worker";

registerServiceWorker();

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} />;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
