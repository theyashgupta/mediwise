import { Link, Outlet, useNavigate, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { useOnline } from "@/common/hooks/use-online";
import { Logo } from "@/common/components/brand/logo";
import { OfflineState } from "@/common/components/offline-state";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "./app-breadcrumb";
import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { focusRing, isTypingTarget, resolveShortcut } from "./nav";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { SiteFooter } from "./site-footer";
import { UpdateLine } from "./update-line";

const sidebarKey = "sidebar";

export function LogoLink({ size }: { size?: "default" | "large" }) {
  return (
    <Link to="/" className={cn("rounded-md", focusRing)}>
      <Logo size={size} />
    </Link>
  );
}

/**
 * Keeps the sidebar collapsed or expanded per browser.
 *
 * @remarks
 * Storage can throw in private windows, so a failure means "expanded" and the choice lasts for the tab only.
 */
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(sidebarKey) === "collapsed";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(sidebarKey, collapsed ? "collapsed" : "expanded");
      // eslint-disable-next-line no-empty
    } catch {}
  }, [collapsed]);
  return [collapsed, setCollapsed] as const;
}

/**
 * Runs the shell shortcuts: g then a letter to go to a page, [ for the sidebar, ? for help.
 *
 * @remarks
 * The "g" prefix expires after one second, so a stray "g" does not capture a later key.
 */
function useShellShortcuts(onToggleSidebar: () => void, setShowShortcuts: (open: boolean) => void) {
  const navigate = useNavigate();
  const afterG = useRef(0);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const shortcut = resolveShortcut(event.key, Date.now() - afterG.current < 1000);
      afterG.current = 0;
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut.action === "wait-for-destination") afterG.current = Date.now();
      if (shortcut.action === "go") void navigate({ to: shortcut.to });
      if (shortcut.action === "toggle-sidebar") onToggleSidebar();
      if (shortcut.action === "show-shortcuts") setShowShortcuts(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, onToggleSidebar, setShowShortcuts]);
}

/**
 * Runs the route guards again when the connection comes back.
 *
 * @remarks
 * The session guard lets an offline visitor into the shell, so the check it skipped runs on reconnect.
 */
function useRecheckOnReconnect() {
  const router = useRouter();
  useEffect(() => {
    const recheck = () => void router.invalidate();
    window.addEventListener("online", recheck);
    return () => window.removeEventListener("online", recheck);
  }, [router]);
}

export function AppShell() {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const t = useT();
  const toggleSidebar = useCallback(() => setCollapsed((value) => !value), [setCollapsed]);
  useShellShortcuts(toggleSidebar, setShowShortcuts);
  useRecheckOnReconnect();
  const online = useOnline();

  return (
    <div className="isolate min-h-svh pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:grid md:grid-cols-[auto_minmax(0,1fr)]">
      <div className="ambient" aria-hidden />
      <a
        href="#content"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:ring-[3px] focus:ring-ring/50"
      >
        {t.shell.skipToContent}
      </a>

      <div className="contents print:hidden">
        <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      </div>

      <div className="flex min-h-svh min-w-0 flex-col">
        <div className="contents print:hidden">
          <AppHeader />
        </div>
        <main
          id="content"
          tabIndex={-1}
          className="mx-auto w-full max-w-content flex-1 px-4 pt-6 pb-24 outline-none md:px-8 md:pt-10 md:pb-12 print:p-0"
        >
          <AppBreadcrumb innerOnly className="mb-4 md:hidden print:hidden" />
          <UpdateLine />
          {!online && <OfflineState />}
          <div hidden={!online}>
            <Outlet />
          </div>
          <SiteFooter className="mt-16" />
        </main>
      </div>

      <div className="contents print:hidden">
        <MobileTabBar />
      </div>
      <ShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </div>
  );
}
