export const site = {
  title: "MediWise: your lab report, explained marker by marker",
  description:
    "Upload a lab report as a PDF, photos or a screenshot. MediWise explains every marker, shows each value against the printed reference range and tracks it across visits.",
  skipToContent: "Skip to content",
  disclaimer:
    "MediWise is for information, not diagnosis. It does not replace a doctor. MediWise is not a medical device.",
  readReport: "Read my report",
  signIn: "Sign in",
  pauseMotion: "Pause motion",
  language: "Language",
  nav: { label: "Main", howItWorks: "How it works", pricing: "Pricing", faq: "FAQ" },
  footer: {
    policies: "Policies",
    terms: "Terms of use",
    privacy: "Privacy policy",
    refunds: "Refund policy",
    contact: "Contact",
    security: "Security",
    legal: (year: number, company: string) =>
      `© ${year} MediWise. MediWise is a brand of ${company}.`,
  },
  notFound: {
    title: "Page not found",
    body: "This page does not exist. Check the address, or go to the home page.",
    home: "Go to the home page",
  },
  finalCta: {
    title: "Know what your next lab report says.",
    body: "Upload it to MediWise. You get every marker explained, a score and questions for your doctor.",
  },
};
