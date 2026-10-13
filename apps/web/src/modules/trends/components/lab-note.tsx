type LabNoteProps = { labCount: number };

export function LabNote({ labCount }: LabNoteProps) {
  if (labCount < 2) return null;
  return (
    <p className="text-sm text-muted-foreground">
      This chart has results from {labCount} labs. Ranges can differ by lab.
    </p>
  );
}
