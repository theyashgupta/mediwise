import { useT } from "@/common/hooks/use-locale";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ThemeSelectProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
};

const options = ["light", "dark", "system"] as const;

export function ThemeSelect({ theme, onThemeChange }: ThemeSelectProps) {
  const t = useT();
  return (
    <div className="space-y-2">
      <Label htmlFor="theme">{t.settings.theme.label}</Label>
      <Select value={theme} onValueChange={onThemeChange}>
        <SelectTrigger id="theme" className="w-full sm:w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t.settings.theme[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
