import { Section } from "@/common/components/section";
import { Button } from "@/components/ui/button";
import { openedText, shareDate } from "../config/share";
import type { ShareLink } from "../types";

type ShareListProps = {
  links: ShareLink[];
  endingId?: string;
  onEnd: (id: string) => void;
};

export function ShareList({ links, endingId, onEnd }: ShareListProps) {
  if (links.length === 0) return null;
  return (
    <Section
      id="shared-links"
      title="Shared links"
      description="Anyone with one of these links can see this report until the link ends."
    >
      <ul className="divide-y overflow-hidden rounded-xl border bg-card">
        {links.map((link) => (
          <li
            key={link.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">Ends on {shareDate(link.expiresAt)}</p>
              <p className="text-sm text-muted-foreground">
                Made on {shareDate(link.createdAt)}. {openedText(link.openCount, link.lastOpenedAt)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEnd(link.id)}
              disabled={endingId === link.id}
            >
              {endingId === link.id ? "Ending the link" : "End link"}
            </Button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
