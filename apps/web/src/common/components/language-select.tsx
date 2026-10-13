import { Languages } from "lucide-react";
import { useId } from "react";
import { setLocale, useLocale, useT } from "@/common/hooks/use-locale";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isLocale, localeNames, locales } from "@/config/messages";
import { cn } from "@/lib/utils";

export function LanguageSelect({ className }: { className?: string }) {
  const id = useId();
  const locale = useLocale();
  const t = useT();
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="flex items-center gap-1.5">
        <Languages className="size-4 text-muted-foreground" aria-hidden />
        {t.common.language.label}
      </Label>
      <Select value={locale} onValueChange={(value) => isLocale(value) && void setLocale(value)}>
        <SelectTrigger id={id} className="w-full sm:w-60" data-testid="language-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
        </SelectContent>
      </Select>
    </div>
  );
}
