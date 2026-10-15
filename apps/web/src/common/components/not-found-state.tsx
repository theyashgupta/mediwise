import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import { EmptyState } from "./empty-state";

export function NotFoundState() {
  const t = useT();
  return (
    <EmptyState
      icon={SearchX}
      title={t.shell.notFound.title}
      body={t.shell.notFound.body}
      action={
        <Button asChild>
          <Link to="/">{t.shell.notFound.home}</Link>
        </Button>
      }
    />
  );
}
