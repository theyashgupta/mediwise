"use client";

import { Languages } from "lucide-react";
import { localePages, type Locale } from "@/config/messages";
import { cn } from "@/lib/utils";

/**
 * Saves the visitor's choice under `locale`, the key the web app reads.
 */
function saveLocale(locale: Locale) {
  try {
    localStorage.setItem("locale", locale);
  } catch {
    /** Private windows can block storage. The link still opens the other page. */
  }
}

export function LanguageSwitch({ current, className }: { current: Locale; className?: string }) {
  const target: Locale = current === "hi" ? "en" : "hi";
  const page = localePages[target];
  return (
    <a
      href={page.path}
      hrefLang={page.lang}
      lang={page.lang}
      onClick={() => saveLocale(target)}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      )}
    >
      <Languages aria-hidden className="size-4 shrink-0" />
      {page.name}
    </a>
  );
}
