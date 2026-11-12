import { Field } from "@/common/components/controls/field";
import { Select, SelectItem } from "@/common/components/controls/select";
import { useT } from "@/common/hooks/use-locale";

type ThemeSelectProps = {
  theme: string;
  onThemeChange: (theme: string) => void;
};

const options = ["light", "dark", "system"] as const;

export function ThemeSelect({ theme, onThemeChange }: ThemeSelectProps) {
  const t = useT();
  return (
    <Field label={t.settings.theme.label}>
      <Select id="theme" value={theme} onValueChange={onThemeChange} className="w-full sm:w-60">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {t.settings.theme[option]}
          </SelectItem>
        ))}
      </Select>
    </Field>
  );
}
