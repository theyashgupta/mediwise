import type { Locale } from "@/config/messages";

export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin;
export const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173").origin;

export const appLinks = {
  signIn: (locale: Locale) => `${appUrl}/login?lang=${locale}`,
  signUp: (locale: Locale) => `${appUrl}/signup?lang=${locale}`,
  terms: `${appUrl}/terms`,
  privacy: `${appUrl}/privacy`,
  refunds: `${appUrl}/refunds`,
  contact: `${appUrl}/contact`,
};

export const buttonStyles = {
  primary:
    "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2",
  outline:
    "inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2",
};
