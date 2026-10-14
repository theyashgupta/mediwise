import { Ellipsis } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { GlassButton } from "@/common/components/surface/glass";
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
        <GlassButton
          data-testid="assistant-menu"
          size="icon"
          className="size-11"
          aria-label={t.label}
        >
          <Ellipsis aria-hidden />
        </GlassButton>
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
