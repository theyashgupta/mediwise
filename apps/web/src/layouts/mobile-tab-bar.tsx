import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { useScrollingDown } from "@/common/hooks/use-scrolling-down";
import { GlassSurface } from "@/common/components/surface/glass";
import { cn } from "@/lib/utils";
import { focusRing, navItems } from "./nav";

const press =
  "transition duration-(--duration-fast) ease-standard active:scale-90 motion-reduce:transition-none";

const tabClass = cn(
  "group/tab relative flex h-12 w-full max-w-14 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground data-[status=active]:text-primary",
  press,
  focusRing,
);

export function MobileTabBar() {
  const t = useT();
  const hidden = useScrollingDown();
  const [home, reports, ...rest] = navItems;
  const tab = ({ to, name, icon: Icon }: (typeof navItems)[number]) => (
    <li key={to} className="flex flex-1 justify-center">
      <Link to={to} activeOptions={{ exact: to === "/" }} className={tabClass}>
        <Icon
          className="size-5 group-data-[status=active]/tab:fill-current/15 group-data-[status=active]/tab:stroke-[2.25]"
          aria-hidden
        />
        <span
          className="absolute bottom-1.5 size-1 rounded-full bg-current opacity-0 group-data-[status=active]/tab:opacity-100"
          aria-hidden
        />
        <span className="sr-only">{t.shell.nav[name]}</span>
      </Link>
    </li>
  );

  return (
    <GlassSurface
      asChild
      layer="bar"
      data-hidden={hidden || undefined}
      className="fixed right-[calc(--spacing(20)+env(safe-area-inset-right))] bottom-[calc(--spacing(4)+env(safe-area-inset-bottom))] left-[calc(--spacing(4)+env(safe-area-inset-left))] z-30 rounded-full border shadow-(--shadow-glass) transition-transform duration-(--duration-base) ease-standard in-data-scroll-locked:translate-y-[calc(100%+--spacing(8)+env(safe-area-inset-bottom))] data-hidden:not-focus-within:translate-y-[calc(100%+--spacing(8)+env(safe-area-inset-bottom))] motion-reduce:transition-none md:hidden"
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
                "flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-(--shadow-glass) hover:bg-primary/90",
                press,
                focusRing,
              )}
            >
              <Upload className="size-5" aria-hidden />
            </Link>
          </li>
          {rest.map(tab)}
        </ul>
      </nav>
    </GlassSurface>
  );
}
