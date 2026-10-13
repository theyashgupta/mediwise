import { Logo } from "../../../web/src/common/components/brand/logo";
import { appLinks } from "@/lib/site";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-40">
      <div
        aria-hidden
        className="nav-backdrop absolute inset-0 border-b bg-(--glass-tint-bar) backdrop-blur-(--blur-glass-bar)"
      />
      <div aria-hidden className="scroll-progress absolute inset-x-0 bottom-0 h-px bg-primary" />
      <nav
        aria-label="Main"
        className="relative mx-auto flex h-13 max-w-content items-center gap-8 px-4 text-sm md:h-14 md:px-8"
      >
        <a
          href="#top"
          className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <Logo className="text-sm" />
        </a>
        <ul className="hidden gap-6 text-muted-foreground md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-4">
          <a
            href={appLinks.signIn}
            className="inline-flex h-8 items-center rounded-md font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            Sign in
          </a>
          <a
            href={appLinks.signUp}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Read my report
          </a>
        </div>
      </nav>
    </header>
  );
}
