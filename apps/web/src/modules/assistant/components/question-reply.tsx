import type { ReactNode } from "react";
import { useT } from "@/common/hooks/use-locale";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FactTarget, Question } from "../types";
import { CitationChip } from "./citation-chip";

type UserBubbleProps = { label?: string; children: ReactNode };

export function UserBubble({ label, children }: UserBubbleProps) {
  return (
    <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary/10 px-4 py-2.5 wrap-anywhere">
      {label && <span className="sr-only">{label}: </span>}
      {children}
    </p>
  );
}

type QuestionReplyProps = {
  item: Question;
  flagging: boolean;
  onFact: (target: FactTarget) => void;
  onFlag: (id: string) => void;
};

export function QuestionReply({ item, flagging, onFact, onFlag }: QuestionReplyProps) {
  const t = useT().assistant;
  return (
    <article data-testid="assistant-item" className="space-y-3">
      <UserBubble label={t.you}>{item.question}</UserBubble>
      {(item.sentences.length > 0 || item.copy) && (
        <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-md border bg-card px-4 py-3">
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
        </div>
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
          <Flag aria-hidden />
          {t.wrong}
        </Button>
      )}
    </article>
  );
}
