import { Languages } from "lucide-react";
import { useId } from "react";
import { Field } from "@/common/components/controls/field";
import { Select, SelectItem } from "@/common/components/controls/select";
import { setLocale, useLocale, useT } from "@/common/hooks/use-locale";
import { isLocale, localeNames, locales } from "@/config/messages";
import { cn } from "@/lib/utils";

export function LanguageSelect({ className }: { className?: string }) {
  const id = useId();
  const locale = useLocale();
  const t = useT();
  return (
    <Field
      className={cn("space-y-2", className)}
      label={
        <span className="flex items-center gap-1.5">
          <Languages className="size-4 text-muted-foreground" aria-hidden />
          {t.common.language.label}
        </span>
      }
    >
      <Select
        id={id}
        value={locale}
        onValueChange={(value) => isLocale(value) && void setLocale(value)}
        className="w-full sm:w-60"
        data-testid="language-select"
      >
        {locales.map((option) => (
          <SelectItem
            key={option}
            value={option}
            lang={option}
            data-testid={`language-option-${option}`}
          >
            {localeNames[option]}
          </SelectItem>
        ))}
      </Select>
    </Field>
  );
}
