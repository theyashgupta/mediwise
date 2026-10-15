import { cleanQuestion } from "@mediwise/shared";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type AskInputProps = {
  value: string;
  busy: boolean;
  disabled: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSubmit: (question: string) => void;
};

export function AskInput({ value, busy, disabled, autoFocus, onChange, onSubmit }: AskInputProps) {
  const t = useT().assistant;
  const [empty, setEmpty] = useState(false);
  const send = () => {
    if (disabled || busy || !value) return;
    const question = cleanQuestion(value);
    setEmpty(question === "");
    if (question) onSubmit(question);
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
          autoFocus={autoFocus}
          readOnly={busy}
          aria-disabled={busy || undefined}
          className="max-h-40 min-h-11 resize-none bg-background"
          onChange={(event) => {
            setEmpty(false);
            onChange(event.target.value);
          }}
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
          disabled={disabled || busy || !value}
        >
          <SendHorizontal aria-hidden />
          {t.send}
        </Button>
      </div>
      {empty && (
        <p role="alert" className="text-sm text-destructive">
          {t.emptyQuestion}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{t.onlyReports}</p>
    </form>
  );
}
