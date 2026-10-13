import { Link, useMatches } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { LogoMark } from "@/common/components/brand/logo";
import { useT } from "@/common/hooks/use-locale";
import { ThemeToggle } from "@/common/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserMenuContainer } from "@/modules/me";
import { ProfileSwitcherContainer } from "@/modules/profiles";
import { AppBreadcrumb } from "./app-breadcrumb";
import { focusRing, pages } from "./nav";

/**
 * Returns true once the window scrolls away from the top.
 */
function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
}

export function AppHeader() {
  const scrolled = useScrolled();
  const t = useT();
  const routeId = useMatches({ select: (matches) => matches.at(-1)?.routeId });
  const upload =
    routeId !== undefined && routeId in pages && pages[routeId as keyof typeof pages].upload;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-colors duration-(--duration-fast) motion-reduce:transition-none md:px-8",
        scrolled ? "border-border bg-glass-bar glass-blur-bar" : "border-transparent",
      )}
    >
      <Link
        to="/"
        aria-label={t.shell.home}
        className={cn("-m-1 rounded-md p-1 md:hidden", focusRing)}
      >
        <LogoMark />
      </Link>
      <div className="min-w-0 md:hidden">
        <ProfileSwitcherContainer placement="inline" />
      </div>
      <AppBreadcrumb className="hidden md:block" />

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {upload && (
          <Button asChild size="sm" className="mr-2 hidden md:inline-flex">
            <Link to="/reports/upload">
              <Upload aria-hidden />
              {t.shell.upload}
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <UserMenuContainer />
      </div>
    </header>
  );
}
