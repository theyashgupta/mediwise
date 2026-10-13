import { useT } from "@/common/hooks/use-locale";

type LabNoteProps = { labCount: number };

export function LabNote({ labCount }: LabNoteProps) {
  const t = useT();
  if (labCount < 2) return null;
  return <p className="text-sm text-muted-foreground">{t.trends.detail.labNote(labCount)}</p>;
}
