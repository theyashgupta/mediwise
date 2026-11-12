import { Ellipsis } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { IconAction } from "@/common/components/icon-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatMenuProps = {
  canClear: boolean;
  onClear: () => void;
};

export function ChatMenu({ canClear, onClear }: ChatMenuProps) {
  const t = useT().assistant.menu;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconAction data-testid="assistant-menu" label={t.label}>
          <Ellipsis aria-hidden />
        </IconAction>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          data-testid="assistant-clear"
          className="min-h-11"
          disabled={!canClear}
          onSelect={onClear}
        >
          {t.clear}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
