import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";
import { contact, policyLinks } from "@/modules/payments";

const linkClass =
  "inline-flex min-h-6 items-center font-medium text-primary underline-offset-4 hover:underline";

export function AboutDetails() {
  const t = useT();
  const copy = t.settings.about;
  return (
    <div className="space-y-6">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
        <dt className="text-muted-foreground">{copy.brand}</dt>
        <dd>{contact.brand}</dd>
        <dt className="text-muted-foreground">{copy.company}</dt>
        <dd>{contact.businessName}</dd>
        <dt className="text-muted-foreground">{copy.email}</dt>
        <dd>
          <a href={`mailto:${contact.email}`} className={linkClass}>
            {contact.email}
          </a>
        </dd>
      </dl>
      <nav aria-label={copy.policies}>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {policyLinks.map(({ to, page }) => (
            <li key={to}>
              <Link to={to} className={linkClass}>
                {t.payments.policyLinks[page]}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
