import { EllipsisVertical } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { IconButton } from "@/common/components/controls/icon-button";
import { glassControl } from "@/common/components/surface/glass";
import { useT } from "@/common/hooks/use-locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type IconActionProps = Omit<ComponentProps<typeof IconButton>, "variant">;

export function IconAction({ className, ...props }: IconActionProps) {
  return <IconButton variant="outline" className={cn(glassControl, className)} {...props} />;
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
