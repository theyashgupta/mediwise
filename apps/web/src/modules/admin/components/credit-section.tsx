import { Section } from "@/common/components/section";
import { formatPlainDate } from "@/common/utils/date";
import { formatRupees } from "@/modules/payments";
import { formatCount, formatCreditChange, formatCredits, kindLabels } from "../config/admin";
import type { CreditGroup } from "../types";

type CreditSectionProps = {
  id: string;
  title: string;
  description: string;
  group: CreditGroup;
  onUser: (userId: string) => void;
};

const cell = "px-3 py-2 whitespace-nowrap";

export function CreditSection({ id, title, description, group, onUser }: CreditSectionProps) {
  return (
    <Section id={id} title={title} description={description}>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {group.totals.map((total) => (
          <div key={total.kind} className="rounded-xl border bg-card p-4">
            <dt className="text-sm text-muted-foreground">
              {kindLabels[total.kind] ?? total.kind}
            </dt>
            <dd
              className="mt-1 font-mono text-2xl font-semibold"
              data-testid={`admin-total-${total.kind}`}
            >
              {formatCount(total.events)}
            </dd>
            {total.kind !== "question" && (
              <dd
                className="text-sm text-muted-foreground"
                data-testid={`admin-total-detail-${total.kind}`}
              >
                {formatCredits(total.credits)}
                {total.amountPaise > 0 && ` · ${formatRupees(total.amountPaise)}`}
              </dd>
            )}
          </div>
        ))}
      </dl>

      {group.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No events in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm" data-testid={`${id}-events`}>
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className={cell}>Date</th>
                <th className={cell}>Kind</th>
                <th className={`${cell} text-right`}>Credits</th>
                <th className={`${cell} text-right`}>Amount</th>
                <th className={cell}>User</th>
                <th className={`${cell} text-right`}>Profiles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {group.events.map((event) => (
                <tr key={event.id}>
                  <td className={cell}>
                    {formatPlainDate(event.at, { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className={cell}>{kindLabels[event.kind] ?? event.kind}</td>
                  <td className={`${cell} text-right font-mono`}>
                    {event.credits === null ? "" : formatCreditChange(event.credits)}
                  </td>
                  <td className={`${cell} text-right font-mono`}>
                    {event.amountPaise === null ? "" : formatRupees(event.amountPaise)}
                  </td>
                  <td className={cell}>
                    <button
                      type="button"
                      title={event.userId}
                      className="font-mono underline-offset-4 hover:underline"
                      onClick={() => onUser(event.userId)}
                    >
                      {event.userId.slice(0, 8)}
                    </button>
                  </td>
                  <td className={`${cell} text-right font-mono`}>{formatCount(event.profiles)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}
