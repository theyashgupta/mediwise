import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

type ProfilePromptProps = {
  title: string;
  body: string;
  action: string;
  to: "/profiles" | "/settings";
  onAction?: () => void;
};

export function ProfilePrompt({ title, body, action, to, onAction }: ProfilePromptProps) {
  return (
    <section className="flex flex-col items-start gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <UserRound className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to={to} onClick={onAction}>
          {action}
        </Link>
      </Button>
    </section>
  );
}
