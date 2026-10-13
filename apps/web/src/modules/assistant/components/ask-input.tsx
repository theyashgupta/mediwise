import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AskInputProps = {
  value: string;
  busy: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function AskInput({ value, busy, disabled, onChange, onSubmit }: AskInputProps) {
  const t = useT().assistant;
  const send = () => {
    if (!disabled && !busy && value.trim()) onSubmit();
  };
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <div className="flex items-end gap-2">
        <Textarea
          data-testid="assistant-input"
          aria-label={t.inputLabel}
          placeholder={t.placeholder}
          maxLength={500}
          rows={1}
          value={value}
          disabled={disabled}
          readOnly={busy}
          aria-disabled={busy || undefined}
          className="max-h-40 min-h-11 bg-background"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send();
            }
          }}
        />
        <Button
          type="submit"
          data-testid="assistant-send"
          className="min-h-11"
          disabled={disabled || busy || !value.trim()}
        >
          {t.send}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t.onlyReports}</p>
    </form>
  );
}
