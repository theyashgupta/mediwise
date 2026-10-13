import { Section } from "@/common/components/section";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { openedText, shareDate } from "../config/share";
import type { ShareLink } from "../types";

type ShareListProps = {
  links: ShareLink[];
  endingId?: string;
  onEnd: (id: string) => void;
};

export function ShareList({ links, endingId, onEnd }: ShareListProps) {
  const t = useT();
  if (links.length === 0) return null;
  return (
    <Section
      id="shared-links"
      title={t.reports.share.listTitle}
      description={t.reports.share.listDescription}
    >
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{t.reports.share.listEndsOn(shareDate(link.expiresAt))}</p>
              <p className="text-sm text-muted-foreground">
                {t.reports.share.madeOn(shareDate(link.createdAt))}{" "}
                {openedText(link.openCount, link.lastOpenedAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEnd(link.id)}
              disabled={endingId === link.id}
            >
              {endingId === link.id ? t.reports.share.ending : t.reports.share.end}
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
