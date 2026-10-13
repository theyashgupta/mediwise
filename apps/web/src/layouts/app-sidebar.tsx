import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/common/components/brand/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProfileSwitcherContainer } from "@/modules/profiles";
import { focusRing, navItems } from "./nav";

function Hint({ show, label, children }: { show: boolean; label: ReactNode; children: ReactNode }) {
  if (!show) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

type AppSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      data-collapsed={collapsed}
      className="group/sidebar sticky top-0 hidden h-svh w-60 flex-col border-r bg-glass-bar transition-[width] duration-(--duration-fast) data-[collapsed=true]:w-14 motion-reduce:transition-none md:flex"
    >
      <div className="flex h-12 shrink-0 items-center px-4">
        <Link
          to="/"
          aria-label={collapsed ? "MediWise home" : undefined}
          className={cn("-m-1 rounded-md p-1", focusRing)}
        >
          {collapsed ? <LogoMark /> : <Logo />}
        </Link>
      </div>

      <nav aria-label="Main" className="mt-4 flex-1 overflow-y-auto px-2">
        <p className="mb-1 h-6 px-3 text-xs leading-6 font-medium text-muted-foreground group-data-[collapsed=true]/sidebar:invisible">
          Menu
        </p>
        <ul className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Hint show={collapsed} label={label}>
                <Link
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  aria-label={collapsed ? label : undefined}
                  className={cn(
                    "flex h-8 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-primary/10 data-[status=active]:font-medium data-[status=active]:text-primary",
                    focusRing,
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              </Hint>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex shrink-0 flex-col gap-1 border-t p-2 group-data-[collapsed=true]/sidebar:items-center">
        <ProfileSwitcherContainer placement={collapsed ? "sidebar-collapsed" : "sidebar"} />
        <Hint
          show
          label={
            <>
              {collapsed ? "Expand" : "Collapse"} the sidebar <kbd className="font-mono">[</kbd>
            </>
          }
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand the sidebar" : "Collapse the sidebar"}
            aria-expanded={!collapsed}
            className={cn(
              "flex h-8 items-center gap-2.5 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
              collapsed ? "w-10 justify-center px-0" : "w-full",
              focusRing,
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <PanelLeftClose className="size-4" aria-hidden />
            )}
            {!collapsed && "Collapse"}
          </button>
        </Hint>
      </div>
    </aside>
  );
}
