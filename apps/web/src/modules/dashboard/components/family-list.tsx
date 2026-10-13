import { Link } from "@tanstack/react-router";
import { Section } from "@/common/components/section";
import { formatPlainDate } from "@/common/utils/date";
import { statusStyles } from "@/common/utils/status";
import { cn } from "@/lib/utils";
import { relationLabels } from "@/modules/profiles";
import { isOlderThanAYear } from "../config/report-age";
import type { FamilyMember } from "../types";

type FamilyListProps = {
  members: FamilyMember[];
  activeId: string | undefined;
  today: Date;
  onSelect: (profileId: string) => void;
};

const textLink =
  "rounded-sm text-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

function MemberSummary({ member, today }: { member: FamilyMember; today: Date }) {
  const { latest } = member;
  const relation = relationLabels[member.relation];
  if (!latest) {
    return (
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{member.name}</span>
        <span className="block truncate text-sm text-muted-foreground">{relation}</span>
        <span className="block text-sm text-muted-foreground">No report yet.</span>
      </span>
    );
  }
  const date = formatPlainDate(latest.date, { day: "numeric", month: "short", year: "numeric" });
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{member.name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {relation} · {date}
        </span>
        {latest.riskCount > 0 && (
          <span className="flex items-center gap-1.5 text-sm">
            <span className={cn("size-1.5 rounded-full", statusStyles.risk.mark)} aria-hidden />
            {latest.riskCount} {latest.riskCount === 1 ? "marker" : "markers"} at risk
          </span>
        )}
        {isOlderThanAYear(latest.date, today) && (
          <span className="block text-sm text-muted-foreground">
            No report in the last 12 months.
          </span>
        )}
      </span>
      {latest.score !== null && (
        <span className="shrink-0 text-right">
          <span className="block font-mono font-medium">{latest.score}</span>
          <span className="block text-xs text-muted-foreground capitalize">{latest.tier}</span>
        </span>
      )}
    </>
  );
}

export function FamilyList({ members, activeId, today, onSelect }: FamilyListProps) {
  return (
    <Section id="your-family" title="Your family">
      {members.length < 2 ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border bg-card px-4 py-3">
          <p className="text-muted-foreground">Add family members to see their reports here.</p>
          <Link to="/profiles" className={textLink}>
            Add a family member
          </Link>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {members.map((member) => (
            <li key={member.id} className="flex items-center">
              <button
                type="button"
                aria-current={member.id === activeId || undefined}
                onClick={() => onSelect(member.id)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset aria-[current=true]:bg-accent/60"
              >
                <MemberSummary member={member} today={today} />
              </button>
              {!member.latest && (
                <Link
                  to="/reports/upload"
                  onClick={() => onSelect(member.id)}
                  className={cn(textLink, "mx-4 shrink-0")}
                >
                  Upload a report
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
