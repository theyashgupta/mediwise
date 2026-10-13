import { Outlet } from "@tanstack/react-router";
import { LogoLink } from "./app-shell";
import { SiteFooter } from "./site-footer";

export function AuthLayout() {
  return (
    <div className="isolate flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-12 md:gap-8">
      <div className="ambient" aria-hidden />
      <LogoLink size="large" />
      <main className="w-full max-w-auth">
        <Outlet />
      </main>
      <SiteFooter className="w-full max-w-auth flex-col! border-t-0 pt-0" />
    </div>
  );
}
