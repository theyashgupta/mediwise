import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Disclaimer } from "@/common/components/disclaimer";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { policyLinks } from "@/modules/payments";

const linkClass =
  "inline-block rounded-sm px-1 py-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

type SiteFooterProps = {
  centered?: boolean;
  className?: string;
};

export function SiteFooter({ centered, className }: SiteFooterProps) {
  const t = useT();
  return (
    <footer
      data-testid="site-footer"
      className={cn("flex flex-col gap-3 border-t pt-6", centered && "items-center", className)}
    >
      <Disclaimer centered={centered} />
      <nav aria-label={t.shell.footer.nav}>
        <ul
          className={cn(
            "text-sm text-balance text-muted-foreground md:whitespace-nowrap",
            centered ? "text-center sm:text-xs" : "-mx-1",
          )}
        >
          <li className="inline">
            <a href={env.landingUrl} className={linkClass}>
              {t.shell.footer.about}
            </a>
          </li>
          {policyLinks.map(({ to, page }) => (
            <li key={to} className="inline">
              <Link to={to} className={linkClass}>
                {t.payments.policyLinks[page]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
