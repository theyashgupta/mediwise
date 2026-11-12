import { Moon, Sun } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { useTheme } from "@/common/hooks/use-theme";
import { IconButton } from "@/common/components/controls/icon-button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useT();
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return (
    <IconButton
      size="sm"
      label={dark ? t.common.theme.useLight : t.common.theme.useDark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </IconButton>
  );
}
