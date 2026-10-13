import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type AskCardProps = {
  reportId: string;
  suggestions: string[];
};

export function AskCard({ reportId, suggestions }: AskCardProps) {
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
              asChild
              variant="outline"
              className="h-auto min-h-11 max-w-full justify-start text-left whitespace-normal"
            >
              <Link
                data-testid="ask-suggestion"
                to="/ask"
                search={{ report: reportId, q: question }}
              >
                {question}
              </Link>
            </Button>
          </li>
        ))}
        <li>
          <Button asChild variant="ghost" className="min-h-11">
            <Link to="/ask" search={{ report: reportId }}>
              {t.open}
            </Link>
          </Button>
        </li>
      </ul>
    </section>
  );
}
