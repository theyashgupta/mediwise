import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Disclaimer } from "@/common/components/disclaimer";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { policyLinks } from "@/modules/payments";

const linkClass =
  "inline-block rounded-sm px-1.5 py-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SiteFooter({ className }: { className?: string }) {
  const t = useT();
  return (
    <footer
      className={cn(
        "flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
        className,
      )}
    >
      <Disclaimer />
      <nav aria-label={t.shell.footer.nav}>
        <ul className="-mx-1.5 flex flex-wrap text-sm text-muted-foreground">
          <li>
            <a href={env.landingUrl} className={linkClass}>
              {t.shell.footer.about}
            </a>
          </li>
          {policyLinks.map(({ to, page }) => (
            <li key={to}>
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
