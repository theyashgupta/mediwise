import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type DoctorQuestionsProps = {
  items: string[];
};

export function DoctorQuestions({ items }: DoctorQuestionsProps) {
  const t = useT();
  if (items.length === 0) {
    return <p className="text-muted-foreground">{t.report.doctorQuestions.empty}</p>;
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(items.map((item, i) => `${i + 1}. ${item}`).join("\n"));
      toast.success(t.report.doctorQuestions.copied);
    } catch {
      toast.error(t.report.doctorQuestions.copyError);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground">{t.report.doctorQuestions.intro}</p>
        <Button variant="outline" size="sm" onClick={() => void copyAll()}>
          <Copy aria-hidden />
          {t.report.doctorQuestions.copyAll}
        </Button>
      </div>
      <ol className="divide-y rounded-xl border bg-card">
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-4 px-4 py-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-sm font-medium">
              {index + 1}
            </span>
            <span className="pt-0.5">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
