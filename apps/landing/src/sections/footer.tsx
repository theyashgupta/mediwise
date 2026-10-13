import { Logo } from "../../../web/src/common/components/brand/logo";
import { appLinks, buttonStyles, disclaimer } from "@/lib/site";

const policyLinks = [
  { href: appLinks.terms, label: "Terms of use" },
  { href: appLinks.privacy, label: "Privacy policy" },
  { href: appLinks.refunds, label: "Refund policy" },
  { href: appLinks.contact, label: "Contact" },
];

const socialLinks: { href: string; label: string }[] = [];

export function FinalCta() {
  return (
    <section
      aria-labelledby="cta-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <div className="reveal rounded-2xl border bg-card px-6 py-14 text-center md:px-12">
        <h2
          id="cta-title"
          className="text-3xl font-semibold tracking-tight text-balance md:text-4xl"
        >
          Know what your next lab report says.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
          Upload it to MediWise. You get every marker explained, a score and questions for your
          doctor.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={appLinks.signUp} className={buttonStyles.primary}>
            Read my report
          </a>
          <a href={appLinks.signIn} className={buttonStyles.outline}>
            Sign in
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {[...policyLinks, ...socialLinks].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="text-sm text-muted-foreground">{disclaimer}</p>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} MediWise</p>
      </div>
    </footer>
  );
}
