import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

export function TrendsLink() {
  const text = useT().dashboard;
  return (
    <Button asChild variant="link" size="sm" className="px-0 has-[>svg:first-child]:pl-0">
      <Link to="/trends" data-testid="block-detail-link">
        {text.trendsLink}
        <ChevronRight aria-hidden />
      </Link>
    </Button>
  );
}
