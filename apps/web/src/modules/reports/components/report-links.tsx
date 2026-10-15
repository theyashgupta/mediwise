import { Link } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import { useState } from "react";
import { useT } from "@/common/hooks/use-locale";
import { formatPlainDate } from "@/common/utils/date";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dateOptions } from "../config/export";
import type { LinkKind, ReportLink } from "../types";

type ReportLinksProps = {
  links: ReportLink[];
  candidates: { id: string; label: string }[];
  busy: boolean;
  failed: boolean;
  onUpdate: (linkId: string, state: "confirmed" | "dismissed") => void;
  onLink: (otherId: string, kind: LinkKind) => void;
};

const kinds = ["repeat", "second_opinion"] as const;

export function ReportLinks({
  links,
  candidates,
  busy,
  failed,
  onUpdate,
  onLink,
}: ReportLinksProps) {
  const t = useT();
  const text = t.report.links;
  const [otherId, setOtherId] = useState("");
  const [kind, setKind] = useState<LinkKind>("repeat");
  const detected = (link: ReportLink) =>
    link.createdBy === "detector" && link.state === "confirmed";

  function describe({ role, kind: linkKind, other }: ReportLink) {
    const name = other.title ?? formatPlainDate(other.date, dateOptions);
    if (role === "later") {
      return linkKind === "repeat" ? text.repeatOf(name) : text.secondOpinionOf(name);
    }
    return linkKind === "repeat" ? text.repeatedIn(name) : text.secondOpinionIn(name);
  }

  return (
    <div className="space-y-4">
      {links.length > 0 && (
        <ul className="space-y-3" data-testid="report-links">
          {links.map((link) => (
            <li
              key={link.id}
              data-testid={`report-link-${link.role}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div className="space-y-1">
                <Link
                  to="/reports/$reportId"
                  params={{ reportId: link.other.id }}
                  className="inline-flex items-center gap-2 font-medium hover:underline"
                >
                  <Link2 className="size-4" aria-hidden />
                  {describe(link)}
                </Link>
                {link.state === "proposed" && (
                  <p className="text-sm text-muted-foreground">{text.proposed}</p>
                )}
                {detected(link) && (
                  <p className="text-sm text-muted-foreground" data-testid="report-link-detected">
                    {text.detected}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {link.state === "proposed" && (
                  <Button size="sm" disabled={busy} onClick={() => onUpdate(link.id, "confirmed")}>
                    {text.confirm}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onUpdate(link.id, "dismissed")}
                  data-testid="report-link-dismiss"
                >
                  {detected(link) ? text.undo : text.dismiss}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {candidates.length > 0 && (
        <form
          className="grid gap-3 sm:grid-cols-[18rem_11rem_auto] sm:justify-start"
          onSubmit={(event) => {
            event.preventDefault();
            if (otherId) onLink(otherId, kind);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="link-report">{text.otherReport}</Label>
            <Select value={otherId} onValueChange={setOtherId}>
              <SelectTrigger id="link-report" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-kind">{text.kind}</Label>
            <Select value={kind} onValueChange={(value) => setKind(value as LinkKind)}>
              <SelectTrigger id="link-kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {kinds.map((option) => (
                  <SelectItem key={option} value={option}>
                    {text.kinds[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            variant="outline"
            className="justify-self-start sm:self-end"
            disabled={busy || !otherId}
          >
            <Link2 aria-hidden />
            {busy ? text.adding : text.add}
          </Button>
        </form>
      )}
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {text.failed}
        </p>
      )}
    </div>
  );
}
