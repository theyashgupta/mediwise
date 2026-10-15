import { MessagesSquare } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type AskCardProps = {
  suggestions: string[];
  onAsk: (question?: string) => void;
};

export function AskCard({ suggestions, onAsk }: AskCardProps) {
  const t = useT().dashboard.ask;
  return (
    <section
      aria-labelledby="ask-card"
      data-testid="ask-card"
      className="space-y-4 rounded-xl border bg-card p-6 sm:p-8"
    >
      <div className="space-y-1.5">
        <h2 id="ask-card" className="flex items-center gap-2 text-lg font-medium">
          <MessagesSquare className="size-5 text-primary" aria-hidden />
          {t.title}
        </h2>
        <p className="max-w-measure text-muted-foreground">{t.body}</p>
      </div>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {suggestions.map((question) => (
          <li key={question}>
            <Button
              data-testid="ask-suggestion"
              variant="outline"
              className="h-auto min-h-11 max-w-full justify-start text-left whitespace-normal"
              onClick={() => onAsk(question)}
            >
              {question}
            </Button>
          </li>
        ))}
        <li>
          <Button variant="ghost" className="min-h-11" onClick={() => onAsk()}>
            {t.open}
          </Button>
        </li>
      </ul>
    </section>
  );
}
