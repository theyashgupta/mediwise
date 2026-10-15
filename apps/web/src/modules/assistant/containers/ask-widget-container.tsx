import { useRouterState } from "@tanstack/react-router";
import { lazy, Suspense, useCallback, useState, type ReactNode } from "react";
import { LoadingState } from "@/common/components/loading-state";
import { useT } from "@/common/hooks/use-locale";
import { SheetTitle } from "@/components/ui/sheet";
import { useMe } from "@/modules/me";
import { AskLauncher } from "../components/ask-launcher";
import { AskPanel } from "../components/ask-panel";
import { OpenAskContext, type AskPrefill } from "../hooks/use-open-ask";

const AskThreadContainer = lazy(() =>
  import("./ask-thread-container").then((module) => ({ default: module.AskThreadContainer })),
);

type AskWidgetContainerProps = { children: ReactNode };

export function AskWidgetContainer({ children }: AskWidgetContainerProps) {
  const t = useT().assistant;
  const me = useMe();
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [opened, setOpened] = useState<(AskPrefill & { path: string }) | null>(null);
  const open = useCallback((prefill: AskPrefill = {}) => setOpened({ ...prefill, path }), [path]);
  const dropReport = useCallback(
    () => setOpened((current) => current && { ...current, report: undefined }),
    [],
  );
  const shown = (me.data?.assistant.enabled ?? false) && path !== "/ask";

  return (
    <OpenAskContext value={open}>
      {children}
      {shown && (
        <AskPanel
          open={opened?.path === path}
          trigger={<AskLauncher />}
          onOpenChange={(next) => (next ? open() : setOpened(null))}
        >
          <Suspense
            fallback={
              <>
                <SheetTitle className="sr-only">{t.title}</SheetTitle>
                <LoadingState variant="list" />
              </>
            }
          >
            <AskThreadContainer
              variant="panel"
              reportId={opened?.report}
              prefill={opened?.q}
              onProfileSwitch={dropReport}
            />
          </Suspense>
        </AskPanel>
      )}
    </OpenAskContext>
  );
}
