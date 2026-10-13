import { Link } from "@tanstack/react-router";
import { Logo } from "@/common/components/brand/logo";
import { Disclaimer } from "@/common/components/disclaimer";
import { PageHeader } from "@/common/components/page-header";
import { policies, policyLinks, policyUpdated, type PolicyPage as Page } from "../config/policies";

type PolicyPageProps = {
  page: Page;
};

export function PolicyPage({ page }: PolicyPageProps) {
  const policy = policies[page];
  return (
    <div className="mx-auto flex min-h-svh max-w-measure flex-col gap-10 px-4 py-12 md:px-8">
      <Link to="/" className="w-fit">
        <Logo className="text-lg" />
      </Link>
      <main>
        <PageHeader title={policy.title} description={`Last change: ${policyUpdated}`} />
        <div className="space-y-10">
          {policy.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.heading}</h2>
              {section.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          ))}
        </div>
      </main>
      <footer className="mt-auto space-y-4 border-t pt-6">
        <nav aria-label="Policies">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {policyLinks.map((link) => (
              <li key={link.page}>
                <Link
                  to={link.to}
                  className="text-muted-foreground hover:text-foreground data-[status=active]:font-medium data-[status=active]:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Disclaimer />
      </footer>
    </div>
  );
}
