import { CircleCheck, Clock } from "lucide-react";

type PurchaseStatusProps = {
  status: "waiting" | "paid" | "late";
  credits: number;
};

export function PurchaseStatus({ status, credits }: PurchaseStatusProps) {
  const added = credits === 1 ? "1 report credit" : `${credits} report credits`;
  return (
    <p role="status" aria-live="polite" className="flex items-start gap-2">
      {status === "paid" ? (
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      ) : (
        <Clock className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      )}
      {status === "waiting" && "We are waiting for your bank to confirm the payment."}
      {status === "paid" && `Payment received. We added ${added} to your account.`}
      {status === "late" &&
        "Your bank did not confirm the payment yet. Your credits show here when it does."}
    </p>
  );
}
