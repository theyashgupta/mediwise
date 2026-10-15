import { Link } from "@tanstack/react-router";
import { Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/common/components/error-state";
import { LoadingState } from "@/common/components/loading-state";
import { PageHeader } from "@/common/components/page-header";
import { GlassButton, GlassSurface } from "@/common/components/surface/glass";
import { useLocale, useT } from "@/common/hooks/use-locale";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Mascot, type MascotState } from "@/modules/mascot";
import { useMe } from "@/modules/me";
import { useActiveProfile } from "@/modules/profiles";
import { AskInput } from "../components/ask-input";
import { AskThread } from "../components/ask-thread";
import { ChatMenu } from "../components/chat-menu";
import { ClearChatDialog } from "../components/clear-chat-dialog";
import { OutOfQuestions } from "../components/out-of-questions";
import { ReviewConsent } from "../components/review-consent";
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

const talkMs = 2400;

type AskThreadContainerProps = {
  variant: "page" | "panel";
  reportId?: string;
  prefill?: string;
  onProfileSwitch: () => void;
};

export function AskThreadContainer({
  variant,
  reportId,
  prefill,
  onProfileSwitch,
}: AskThreadContainerProps) {
  const t = useT().assistant;
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
  const wide = useWideScreen() && variant === "page";
  const [draft, setDraft] = useState(prefill ?? "");
  const [shownPrefill, setShownPrefill] = useState(prefill);
  if (prefill !== shownPrefill) {
    setShownPrefill(prefill);
    if (prefill) setDraft(prefill);
  }
  const [fact, setFact] = useState<FactTarget | null>(null);
  const [talking, setTalking] = useState(false);
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
    onProfileSwitch();
  }, [profile, ask, onProfileSwitch]);

  const loaded = questions.data !== undefined;
  useEffect(() => {
    if (loaded && (variant === "panel" || window.scrollY === 0))
      end.current?.scrollIntoView({ block: "end" });
  }, [loaded, variant]);

  useEffect(() => {
    if (!talking) return;
    const timer = setTimeout(() => setTalking(false), talkMs);
    return () => clearTimeout(timer);
  }, [talking]);

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
    ask.mutateAsync({ question, ...(reportId && { reportId }) }).then(() => {
      setDraft("");
      setTalking(true);
      requestAnimationFrame(() => end.current?.scrollIntoView({ block: "end" }));
    });

  const items = (questions.data ?? []).toReversed();
  const title = profile ? t.titleFor(profile.name) : t.title;
  const left = me.data?.questionsLeft ?? 0;
  const out = me.data?.assistant.outOfQuestions ?? null;
  const needsConsent = Boolean(me.data?.assistant.reviewRequired && !me.data.assistant.consented);
  const mascot: MascotState = ask.isPending
    ? "thinking"
    : talking
      ? "talking"
      : draft
        ? "listening"
        : "idle";
  const leftNote = left >= 1 && left <= 5 && (
    <span data-testid="assistant-left" className="text-sm text-muted-foreground">
      {t.left(left)}
    </span>
  );
  const menu = <ChatMenu canClear={items.length > 0} onClear={() => setClearing(true)} />;

  const thread = (
    <>
      {questions.isPending ? (
        <LoadingState variant="list" />
      ) : questions.isError ? (
        <ErrorState message={t.loadError} onRetry={() => void questions.refetch()} />
      ) : (
        <AskThread
          items={items}
          pending={ask.isPending ? ask.variables.question : null}
          error={ask.isError ? ask.error.message : undefined}
          flagging={flag.isPending ? flag.variables : undefined}
          onFact={setFact}
          onFlag={(id) => flag.mutate(id)}
        />
      )}
      <div ref={end} className={variant === "page" ? "scroll-mb-44 md:scroll-mb-36" : undefined} />
    </>
  );

  const composer = (
    <>
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
        autoFocus={variant === "panel"}
        onChange={setDraft}
        onSubmit={send}
      />
    </>
  );

  const overlays = (
    <>
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
    </>
  );

  if (variant === "panel") {
    return (
      <>
        <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-3 py-2">
          <Mascot state={mascot} size={48} />
          <div className="order-last min-w-0 basis-full px-1 sm:order-none sm:flex-1 sm:basis-0 sm:px-0">
            <SheetTitle className="text-base text-balance wrap-break-word">{title}</SheetTitle>
            {leftNote}
          </div>
          <GlassButton
            asChild
            size="icon"
            className="ml-auto size-11 sm:ml-0"
            aria-label={t.widget.fullPage}
          >
            <Link to="/ask" search={{ report: reportId, q: draft || undefined }}>
              <Maximize2 aria-hidden />
            </Link>
          </GlassButton>
          {menu}
          <SheetClose asChild>
            <GlassButton
              data-testid="ask-close"
              size="icon"
              className="size-11"
              aria-label={t.widget.close}
            >
              <X aria-hidden />
            </GlassButton>
          </SheetClose>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{thread}</div>
        <div className="border-t px-4 pt-3 pb-[calc(--spacing(3)+env(safe-area-inset-bottom))] md:pb-3">
          {composer}
        </div>
        {overlays}
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title={title}
        heading={
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Mascot state={mascot} size={48} className="md:size-24" />
              <h1 className="font-display text-display text-balance wrap-anywhere">{title}</h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {leftNote}
              {menu}
            </div>
          </div>
        }
      />
      <div className="xl:grid xl:grid-cols-[minmax(0,var(--container-measure))_minmax(0,1fr)] xl:gap-10">
        <section className="max-w-measure min-w-0">
          {thread}
          <GlassSurface
            asChild
            layer="bar"
            className="sticky bottom-[calc(--spacing(22)+env(safe-area-inset-bottom))] z-20 mt-8 -mx-4 border-t px-4 py-3 md:bottom-0 md:mx-0 md:rounded-2xl md:border"
          >
            <div>{composer}</div>
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
      {overlays}
    </div>
  );
}
