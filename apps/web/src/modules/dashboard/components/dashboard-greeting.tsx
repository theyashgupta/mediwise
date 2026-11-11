import { PageHeader } from "@/common/components/page-header";
import { useT } from "@/common/hooks/use-locale";
import { formatDate } from "@/common/utils/date";

type DashboardGreetingProps = {
  firstName?: string;
  now: Date;
};

export function DashboardGreeting({ firstName, now }: DashboardGreetingProps) {
  const text = useT().dashboard.greeting;
  const hour = now.getHours();
  const greeting = text[hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"];
  return (
    <PageHeader
      title={firstName ? text.named(greeting, firstName) : greeting}
      description={formatDate(now, { weekday: "long", day: "numeric", month: "long" })}
    />
  );
}
