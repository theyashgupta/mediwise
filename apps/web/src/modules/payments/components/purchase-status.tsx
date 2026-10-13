import { CircleCheck, Clock } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";

type PurchaseStatusProps = {
  status: "waiting" | "paid" | "late";
  credits: number;
};

export function PurchaseStatus({ status, credits }: PurchaseStatusProps) {
  const t = useT();
  return (
    <p
      role="status"
      aria-live="polite"
      className="flex items-start gap-2"
      data-testid={`purchase-status-${status}`}
    >
      {status === "paid" ? (
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      {status === "waiting" && t.payments.status.waiting}
      {status === "paid" && t.payments.status.paid(credits)}
      {status === "late" && t.payments.status.late}
    </p>
  );
}
