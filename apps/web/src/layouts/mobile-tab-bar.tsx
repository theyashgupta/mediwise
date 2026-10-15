import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { useScrollingDown } from "@/common/hooks/use-scrolling-down";
import { GlassSurface } from "@/common/components/surface/glass";
import { cn } from "@/lib/utils";
import { focusRing, navItems } from "./nav";

const press =
  "transition duration-(--duration-fast) ease-standard motion-safe:active:scale-90 motion-reduce:transition-none";

const tabClass = cn(
  "group/tab flex h-12 w-full max-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-muted-foreground not-data-[status=active]:hover:bg-foreground/5 not-data-[status=active]:hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:text-primary",
  press,
  focusRing,
);

const labelClass = "text-[11px] leading-3 font-medium whitespace-nowrap";

export function MobileTabBar() {
  const t = useT();
  const hidden = useScrollingDown();
  const [home, reports, trends, profiles] = navItems;
  const tab = ({
    to,
    name,
    icon: Icon,
  }: Exclude<(typeof navItems)[number], { name: "settings" }>) => (
    <li key={to} className="flex flex-1 justify-center">
      <Link to={to} activeOptions={{ exact: to === "/" }} className={tabClass}>
        <Icon
          className="size-5 group-data-[status=active]/tab:fill-current/15 group-data-[status=active]/tab:stroke-[2.25]"
          aria-hidden
        />
        <span className={labelClass}>{t.shell.tabs[name]}</span>
      </Link>
    </li>
  );

  return (
    <GlassSurface
      asChild
      layer="bar"
      data-hidden={hidden || undefined}
      data-testid="mobile-tab-bar"
      className="fixed right-[calc(--spacing(4)+env(safe-area-inset-right))] bottom-[calc(--spacing(4)+env(safe-area-inset-bottom))] left-[calc(--spacing(4)+env(safe-area-inset-left))] z-30 mx-auto max-w-md rounded-full border shadow-(--shadow-glass) transition-transform duration-(--duration-base) ease-standard in-data-scroll-locked:translate-y-[calc(100%+--spacing(8)+env(safe-area-inset-bottom))] data-hidden:not-focus-within:translate-y-[calc(100%+--spacing(8)+env(safe-area-inset-bottom))] motion-reduce:transition-none md:hidden"
    >
      <nav aria-label={t.shell.mainNav}>
        <ul className="flex h-16 items-center px-1.5">
          {tab(home)}
          {tab(reports)}
          <li className="flex flex-1 justify-center">
            <Link
              to="/reports/upload"
              aria-label={t.shell.upload}
              className={cn(
                "group/upload flex h-12 w-full max-w-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-muted-foreground",
                press,
                focusRing,
              )}
            >
              <span className="-mt-7 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--shadow-glass) group-hover/upload:bg-primary/90">
                <Upload className="size-5" aria-hidden />
              </span>
              <span className={labelClass}>{t.shell.tabs.upload}</span>
            </Link>
          </li>
          {tab(trends)}
          {tab(profiles)}
        </ul>
      </nav>
    </GlassSurface>
  );
}
