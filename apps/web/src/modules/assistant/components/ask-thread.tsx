import { MessagesSquare } from "lucide-react";
import { EmptyState } from "@/common/components/empty-state";
import { useT } from "@/common/hooks/use-locale";
import type { FactTarget, Question } from "../types";
import { QuestionReply, UserBubble } from "./question-reply";

type AskThreadProps = {
  items: Question[];
  pending: string | null;
  error?: string;
  flagging?: string;
  onFact: (target: FactTarget) => void;
  onFlag: (id: string) => void;
};

export function AskThread({ items, pending, error, flagging, onFact, onFlag }: AskThreadProps) {
  const t = useT().assistant;
  return (
    <div role="log" aria-label={t.widget.thread} data-testid="assistant-chat" className="space-y-8">
      {items.length === 0 && pending === null && (
        <EmptyState icon={MessagesSquare} title={t.empty.title} body={t.empty.body} />
      )}
      {items.map((item) => (
        <QuestionReply
          key={item.id}
          item={item}
          flagging={flagging === item.id}
          onFact={onFact}
          onFlag={onFlag}
        />
      ))}
      {pending !== null && (
        <article className="space-y-3" data-testid="assistant-pending">
          <UserBubble>{pending}</UserBubble>
          <p
            role="status"
            className="w-fit rounded-2xl rounded-bl-md border bg-card px-4 py-2.5 text-muted-foreground"
          >
            {t.writing}
          </p>
        </article>
      )}
      {error && (
        <p
          role="alert"
          data-testid="assistant-error"
          className="rounded-xl border border-dashed px-4 py-3"
        >
          {error}
        </p>
      )}
    </div>
  );
}
