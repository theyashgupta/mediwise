import { Outlet } from "@tanstack/react-router";
import { OfflineState } from "@/common/components/offline-state";
import { useOnline } from "@/common/hooks/use-online";
import { LogoLink } from "./app-shell";
import { SiteFooter } from "./site-footer";

export function AuthLayout() {
  const online = useOnline();
  return (
    <div className="isolate flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-12 md:gap-8">
      <div className="ambient" aria-hidden />
      <LogoLink size="large" />
      <main className="w-full max-w-auth">
        {!online && <OfflineState />}
        <Outlet />
      </main>
      <SiteFooter centered className="w-full max-w-auth border-t-0 pt-0" />
    </div>
  );
}
