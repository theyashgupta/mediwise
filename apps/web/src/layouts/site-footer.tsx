import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { Disclaimer } from "@/common/components/disclaimer";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { contact, policyLinks } from "@/modules/payments";

const linkClass =
  "inline-block rounded-sm px-1 py-1 underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function SiteFooter({ className }: { className?: string }) {
  const t = useT();
  return (
    <footer className={cn("flex flex-col gap-3 border-t pt-6", className)}>
      <div className="space-y-2">
        <Disclaimer />
        <p className="text-xs text-muted-foreground">
          {t.shell.footer.legal(new Date().getFullYear(), contact.businessName)}
        </p>
      </div>
      <nav aria-label={t.shell.footer.nav}>
        <ul className="-mx-1 text-sm text-balance text-muted-foreground md:whitespace-nowrap">
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
