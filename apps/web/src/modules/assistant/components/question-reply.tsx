import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import type { FactTarget, Question } from "../types";
import { CitationChip } from "./citation-chip";

type QuestionReplyProps = {
  item: Question;
  flagging: boolean;
  onFact: (target: FactTarget) => void;
  onFlag: (id: string) => void;
};

export function QuestionReply({ item, flagging, onFact, onFlag }: QuestionReplyProps) {
  const t = useT().assistant;
  return (
    <article data-testid="assistant-item" className="space-y-4">
      <p className="ml-auto w-fit max-w-full rounded-2xl bg-muted px-4 py-2.5 wrap-anywhere">
        <span className="sr-only">{t.you}: </span>
        {item.question}
      </p>
      {item.sentences.length > 0 && (
        <div data-testid="assistant-answer" className="space-y-3 wrap-anywhere">
          {item.sentences.map((sentence, index) => (
            <div key={index} className="space-y-2">
              <p>{sentence.text}</p>
              {sentence.cites.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sentence.cites.map((cite, citeIndex) => (
                    <CitationChip key={citeIndex} cite={cite} onFact={onFact} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {item.copy && (
        <p
          data-testid="assistant-refusal"
          className="rounded-xl border border-dashed px-4 py-3 text-muted-foreground"
        >
          {item.copy}
        </p>
      )}
      {item.flagged ? (
        <p data-testid="assistant-flagged" className="text-sm text-muted-foreground">
          {t.markedWrong}
        </p>
      ) : (
        <Button
          data-testid="assistant-wrong"
          variant="ghost"
          size="sm"
          className="-ml-2.5 min-h-11 text-muted-foreground"
          disabled={flagging}
          onClick={() => onFlag(item.id)}
        >
          {t.wrong}
        </Button>
      )}
    </article>
  );
}
