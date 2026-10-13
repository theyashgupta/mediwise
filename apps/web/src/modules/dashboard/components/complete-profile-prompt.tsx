import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type CompleteProfilePromptProps = {
  name: string;
};

export function CompleteProfilePrompt({ name }: CompleteProfilePromptProps) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <UserRound className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-medium">Complete {name}&rsquo;s profile</h2>
        <p className="text-sm text-muted-foreground">
          Add a date of birth and a sex. MediWise uses them to score each marker against the correct
          range.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/profiles">Complete profile</Link>
      </Button>
    </section>
  );
}
