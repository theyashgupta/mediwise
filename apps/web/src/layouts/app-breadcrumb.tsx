import { Link, useMatches, useRouter } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { useCrumbLabels } from "@/common/hooks/use-crumb-label";
import { cn } from "@/lib/utils";
import { fillPath, pageTrail } from "./nav";

type AppBreadcrumbProps = {
  className?: string;
  innerOnly?: boolean;
};

export function AppBreadcrumb({ className, innerOnly }: AppBreadcrumbProps) {
  const router = useRouter();
  const labels = useCrumbLabels();
  const t = useT();
  const match = useMatches({ select: (matches) => matches.at(-1) });
  if (!match || match.status === "notFound") return null;
  const trail = pageTrail(match.routeId).map(({ id, page }) => {
    const href = fillPath(router.routesById[id].fullPath, match.params);
    return { href, label: labels.get(href) ?? t.shell.pages[page.name] };
  });
  if (trail.length < (innerOnly ? 2 : 1)) return null;

  return (
    <nav aria-label={t.shell.breadcrumb} className={cn("min-w-0", className)}>
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {trail.map(({ href, label }, index) =>
          index === trail.length - 1 ? (
            <li
              key={href}
              aria-current="page"
              title={label}
              className="min-w-0 truncate text-base font-semibold md:text-lg"
            >
              {label}
            </li>
          ) : (
            <li key={href} className="flex min-w-0 shrink items-center gap-1.5">
              <Link
                to={href}
                className="truncate rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {label}
              </Link>
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            </li>
          ),
        )}
      </ol>
    </nav>
  );
}
