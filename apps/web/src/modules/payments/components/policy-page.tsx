import { policyVersion } from "@mediwise/shared";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/common/components/brand/logo";
import { Disclaimer } from "@/common/components/disclaimer";
import { PageHeader } from "@/common/components/page-header";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import {
  contact,
  policies,
  policyLinks,
  type PolicyPage as Page,
  washingtonSectionId,
} from "../config/policies";

type PolicyPageProps = {
  page: Page;
};

export function PolicyPage({ page }: PolicyPageProps) {
  const t = useT();
  const policy = policies[page];
  const updated = new Intl.DateTimeFormat(getIntlTag(), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(policy.updatedAt));
  return (
    <div className="mx-auto flex min-h-svh max-w-measure flex-col gap-10 px-4 py-12 md:px-8">
      <Link to="/" className="w-fit">
        <Logo className="text-lg" />
      </Link>
      <main>
        <PageHeader
          title={policy.title}
          description={`${t.payments.policy.version(policyVersion)} ${t.payments.policy.lastChange(updated)}`}
        />
        {page === "privacy" && (
          <p className="-mt-4 mb-8">
            <a
              href={`#${washingtonSectionId}`}
              className="font-medium underline underline-offset-4"
            >
              {t.payments.policy.washingtonLink}
            </a>
          </p>
        )}
        <div
          className="space-y-3 [&_[id]]:scroll-mt-6 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6 [&>h2]:pt-7 [&>h2]:text-xl [&>h2]:font-semibold [&>h2:first-child]:pt-0"
          dangerouslySetInnerHTML={{ __html: policy.html }}
        />
      </main>
      <footer className="mt-auto space-y-4 border-t pt-6">
        <nav aria-label={t.payments.policy.nav}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {policyLinks.map((link) => (
              <li key={link.page}>
                <Link
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground"
                >
                  {t.payments.policyLinks[link.page]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Disclaimer />
        <p className="text-xs text-muted-foreground">
          {t.shell.footer.legal(new Date().getFullYear(), contact.businessName)}
        </p>
      </footer>
    </div>
  );
}
