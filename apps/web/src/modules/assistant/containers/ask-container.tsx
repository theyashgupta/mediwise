import { getRouteApi } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/common/components/empty-state";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { GlassSurface } from "@/common/components/surface/glass";
import { useLocale, useT } from "@/common/hooks/use-locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMe } from "@/modules/me";
import { useActiveProfile } from "@/modules/profiles";
import { AskInput } from "../components/ask-input";
import { ChatMenu } from "../components/chat-menu";
import { ClearChatDialog } from "../components/clear-chat-dialog";
import { OutOfQuestions } from "../components/out-of-questions";
import { ReviewConsent } from "../components/review-consent";
import { QuestionReply } from "../components/question-reply";
import { useQuestionPack } from "../hooks/use-question-pack";
import { useReviewConsent } from "../hooks/use-review-consent";
import {
  useAskQuestion,
  useClearQuestions,
  useFlagQuestion,
  useQuestions,
} from "../hooks/use-questions";
import { useWideScreen } from "../hooks/use-wide-screen";
import type { FactTarget } from "../types";
import { FactCardContainer } from "./fact-card-container";

const route = getRouteApi("/_app/ask");

export function AskContainer() {
  const t = useT().assistant;
  const search = route.useSearch();
  const navigate = route.useNavigate();
  const me = useMe();
  const enabled = me.data?.assistant.enabled ?? false;
  const { profile } = useActiveProfile();
  const questions = useQuestions(profile?.id, enabled);
  const ask = useAskQuestion(profile?.id ?? "");
  const flag = useFlagQuestion(profile?.id ?? "");
  const clear = useClearQuestions(profile?.id ?? "");
  const pack = useQuestionPack();
  const consent = useReviewConsent();
  const locale = useLocale();
  const [clearing, setClearing] = useState(false);
  const wide = useWideScreen();
  const [draft, setDraft] = useState(search.q ?? "");
  const [prefill, setPrefill] = useState(search.q);
  if (search.q !== prefill) {
    setPrefill(search.q);
    if (search.q) setDraft(search.q);
  }
  const [fact, setFact] = useState<FactTarget | null>(null);
  const shownProfile = useRef(profile?.id);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile || shownProfile.current === profile.id) return;
    const first = shownProfile.current === undefined;
    shownProfile.current = profile.id;
    if (first) return;
    setFact(null);
    setDraft("");
    ask.reset();
    if (search.report) void navigate({ search: {}, replace: true });
  }, [profile, search.report, navigate, ask]);

  const loaded = questions.data !== undefined;
  useEffect(() => {
    if (loaded && window.scrollY === 0) end.current?.scrollIntoView({ block: "end" });
  }, [loaded]);

  if (me.isPending) return <LoadingState variant="page" />;
  if (me.isError && me.data === undefined)
    return <ErrorState message={t.loadError} onRetry={() => void me.refetch()} />;
  if (!enabled) {
    return (
      <p data-testid="assistant-off" className="rounded-xl border border-dashed px-4 py-3">
        {t.off}
      </p>
    );
  }

  const send = (question: string) =>
    ask.mutate(
      { question, ...(search.report && { reportId: search.report }) },
      {
        onSuccess: () => {
          setDraft("");
          requestAnimationFrame(() => end.current?.scrollIntoView({ block: "end" }));
        },
      },
    );

  const items = (questions.data ?? []).toReversed();
  const title = profile ? t.titleFor(profile.name) : t.title;
  const left = me.data?.questionsLeft ?? 0;
  const out = me.data?.assistant.outOfQuestions ?? null;
  const needsConsent = Boolean(me.data?.assistant.reviewRequired && !me.data.assistant.consented);

  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <div className="flex items-center gap-3">
            {left >= 1 && left <= 5 && (
              <span data-testid="assistant-left" className="text-sm text-muted-foreground">
                {t.left(left)}
              </span>
            )}
            <ChatMenu canClear={items.length > 0} onClear={() => setClearing(true)} />
          </div>
        }
      />
      <div className="xl:grid xl:grid-cols-[minmax(0,var(--container-measure))_minmax(0,1fr)] xl:gap-10">
        <section className="max-w-measure min-w-0">
          {questions.isPending ? (
            <LoadingState variant="list" />
          ) : questions.isError ? (
            <ErrorState message={t.loadError} onRetry={() => void questions.refetch()} />
          ) : (
            <div data-testid="assistant-chat" className="space-y-10">
              {items.length === 0 && !ask.isPending && (
                <EmptyState icon={MessagesSquare} title={t.empty.title} body={t.empty.body} />
              )}
              {items.map((item) => (
                <QuestionReply
                  key={item.id}
                  item={item}
                  flagging={flag.isPending && flag.variables === item.id}
                  onFact={setFact}
                  onFlag={(id) => flag.mutate(id)}
                />
              ))}
              {ask.isPending && (
                <article className="space-y-4" data-testid="assistant-pending">
                  <p className="ml-auto w-fit max-w-full rounded-2xl bg-muted px-4 py-2.5 wrap-anywhere">
                    {ask.variables.question}
                  </p>
                  <p role="status" className="text-muted-foreground">
                    {t.writing}
                  </p>
                </article>
              )}
              {ask.isError && (
                <p
                  role="alert"
                  data-testid="assistant-error"
                  className="rounded-xl border border-dashed px-4 py-3"
                >
                  {ask.error.message}
                </p>
              )}
            </div>
          )}
          <div ref={end} className="scroll-mb-44 md:scroll-mb-36" />
          <GlassSurface
            asChild
            layer="bar"
            className="sticky bottom-[calc(--spacing(22)+env(safe-area-inset-bottom))] z-20 mt-8 -mx-4 border-t px-4 py-3 md:bottom-0 md:mx-0 md:rounded-2xl md:border"
          >
            <div>
              {needsConsent && (
                <ReviewConsent
                  pending={consent.isPending}
                  error={consent.error?.message}
                  onAgree={consent.agree}
                />
              )}
              {out && (
                <OutOfQuestions
                  step={out}
                  pending={pack.isPending}
                  error={pack.error?.message}
                  onUseCredit={() => pack.mutate()}
                />
              )}
              {locale === "hi" && (
                <p data-testid="assistant-english" className="mb-2 text-sm text-muted-foreground">
                  {t.englishOnly}
                </p>
              )}
              <AskInput
                value={draft}
                busy={ask.isPending}
                disabled={!profile || out !== null || needsConsent}
                onChange={setDraft}
                onSubmit={send}
              />
            </div>
          </GlassSurface>
        </section>
        {wide && (
          <aside aria-label={t.fact.title}>
            <div className="sticky top-24 rounded-2xl border bg-card p-6">
              {fact ? (
                <FactCardContainer target={fact} />
              ) : (
                <p className="text-muted-foreground">{t.fact.hint}</p>
              )}
            </div>
          </aside>
        )}
      </div>
      <ClearChatDialog
        open={clearing}
        clearing={clear.isPending}
        error={clear.error?.message}
        onOpenChange={setClearing}
        onConfirm={() => clear.mutate(undefined, { onSuccess: () => setClearing(false) })}
      />
      {!wide && (
        <Sheet open={fact !== null} onOpenChange={(open) => !open && setFact(null)}>
          <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
            <SheetHeader>
              <SheetTitle>{t.fact.title}</SheetTitle>
              <SheetDescription className="sr-only">{t.fact.hint}</SheetDescription>
            </SheetHeader>
            <div className="px-4 pb-4">{fact && <FactCardContainer target={fact} />}</div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
