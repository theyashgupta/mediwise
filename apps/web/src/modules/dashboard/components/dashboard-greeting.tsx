import { PageHeader } from "@/common/components/page-header";

type DashboardGreetingProps = {
  firstName?: string;
  now: Date;
};

export function DashboardGreeting({ firstName, now }: DashboardGreetingProps) {
  const hour = now.getHours();
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return (
    <PageHeader
      title={firstName ? `Good ${part}, ${firstName}` : `Good ${part}`}
      description={now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })}
    />
  );
}
