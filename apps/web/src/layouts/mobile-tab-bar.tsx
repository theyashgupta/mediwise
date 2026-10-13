import { Link } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { GlassSurface } from "@/common/components/surface/glass";
import { cn } from "@/lib/utils";
import { focusRing, navItems } from "./nav";

const tabClass = cn(
  "flex h-14 flex-col items-center justify-center gap-1 text-xs leading-none text-muted-foreground data-[status=active]:font-medium data-[status=active]:text-primary",
  focusRing,
);

export function MobileTabBar() {
  const [home, reports, ...rest] = navItems;
  const tab = ({ to, label, icon: Icon }: (typeof navItems)[number]) => (
    <li key={to}>
      <Link to={to} activeOptions={{ exact: to === "/" }} className={tabClass}>
        <span className="flex h-7 items-center">
          <Icon className="size-5" aria-hidden />
        </span>
        {label}
      </Link>
    </li>
  );

  return (
    <GlassSurface
      asChild
      layer="bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <nav aria-label="Main">
        <ul className="grid grid-cols-6">
          {tab(home)}
          {tab(reports)}
          <li>
            <Link to="/reports/upload" aria-label="Upload a report" className={tabClass}>
              <span className="flex h-7 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Upload className="size-4" aria-hidden />
              </span>
              <span aria-hidden>Upload</span>
            </Link>
          </li>
          {rest.map(tab)}
        </ul>
      </nav>
    </GlassSurface>
  );
}
