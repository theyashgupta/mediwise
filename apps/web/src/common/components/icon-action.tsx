import { EllipsisVertical } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { GlassButton } from "@/common/components/surface/glass";
import { useT } from "@/common/hooks/use-locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type IconActionProps = Omit<ComponentProps<typeof GlassButton>, "size" | "aria-label"> & {
  label: string;
};

export function IconAction({ label, className, ...props }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <GlassButton
          size="icon"
          aria-label={label}
          className={cn("size-11 md:size-9", className)}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function OverflowMenu({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction label={t.shell.moreActions} data-testid="overflow-menu">
          <EllipsisVertical aria-hidden />
        </IconAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
