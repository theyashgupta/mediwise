import { Link } from "@tanstack/react-router";
import { ChevronsUpDown, Users } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Profile } from "../types";

export type ProfileSwitcherPlacement = "sidebar" | "sidebar-collapsed" | "inline";

type ProfileSwitcherProps = {
  profiles: Profile[];
  active?: Profile;
  placement: ProfileSwitcherPlacement;
  onSelect: (id: string) => void;
};

function Initial({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary uppercase",
        className,
      )}
      aria-hidden
    >
      {name?.charAt(0)}
    </span>
  );
}

export function ProfileSwitcher({ profiles, active, placement, onSelect }: ProfileSwitcherProps) {
  const t = useT();
  const name = active?.name ?? t.common.loading;
  const relation = active && t.profiles.relation[active.relation];
  const trigger = (
    <DropdownMenuTrigger
      aria-label={placement === "sidebar-collapsed" ? t.profiles.switcher.label(name) : undefined}
      data-testid={`profile-switcher-${placement}`}
      className={cn(
        "flex items-center gap-2 rounded-md text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-accent",
        placement === "sidebar" && "h-11 w-full px-2",
        placement === "sidebar-collapsed" && "size-10 justify-center",
        placement === "inline" && "h-8 max-w-48 min-w-0 px-1.5",
      )}
    >
      <Initial
        name={active?.name}
        className={placement === "inline" ? "size-6 text-xs" : "size-7 text-sm"}
      />
      {placement === "sidebar" && (
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-muted-foreground">{relation}</span>
        </span>
      )}
      {placement === "inline" && <span className="truncate text-sm font-medium">{name}</span>}
      {placement !== "sidebar-collapsed" && (
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {placement === "sidebar-collapsed" ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{name}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent
        side={placement === "inline" ? "bottom" : placement === "sidebar" ? "top" : "right"}
        align={placement === "inline" ? "start" : "end"}
        className={
          placement === "sidebar" ? "w-(--radix-dropdown-menu-trigger-width) min-w-56" : "w-60"
        }
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t.profiles.switcher.viewingFor}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={active?.id} onValueChange={onSelect}>
          {profiles.map((profile) => (
            <DropdownMenuRadioItem key={profile.id} value={profile.id} data-testid="profile-option">
              <Initial name={profile.name} className="size-5 text-xs" />
              <span className="min-w-0 flex-1 truncate">{profile.name}</span>
              <span className="text-xs text-muted-foreground">
                {t.profiles.relation[profile.relation]}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profiles">
            <Users aria-hidden />
            {t.profiles.switcher.manage}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
