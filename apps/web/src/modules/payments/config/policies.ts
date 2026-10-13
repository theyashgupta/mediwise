export const contact = {
  businessName: "[legal name of the business owner]",
  email: "[contact email]",
  address: "[postal address in India]",
};

export const policyUpdated = "2026-10-13";

export type PolicyPage = "terms" | "privacy" | "refunds" | "contact";

type Policy = { title: string; sections: { heading: string; body: string[] }[] };

export const policyLinks = [
  { page: "terms", to: "/terms" },
  { page: "privacy", to: "/privacy" },
  { page: "refunds", to: "/refunds" },
  { page: "contact", to: "/contact" },
] as const;

export const policies: Record<PolicyPage, Policy> = {
  terms: {
    title: "Terms of use",
    sections: [
      {
        heading: "What MediWise does",
        body: [
          "MediWise reads your lab reports and explains each marker.",
          "MediWise is for information, not diagnosis. It does not replace a doctor.",
          "Speak to a doctor before you make a decision about your health.",
        ],
      },
      {
        heading: "Your account",
        body: [
          "You must be 18 or older to make an account.",
          "You can add profiles for members of your family. You must have their permission to upload their reports.",
          "Keep your password secret. You are responsible for all use of your account.",
        ],
      },
      {
        heading: "Report credits",
        body: [
          "Each report that MediWise reads uses one report credit.",
          "When we cannot read a report, we return its credit to you.",
          "A credit has no cash value. You cannot move credits to a different account.",
        ],
      },
      {
        heading: "Payments",
        body: [
          "Prices are in Indian rupees.",
          "Cashfree Payments processes each payment. MediWise does not see or keep your card or bank details.",
          "Refunds follow the refund policy.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "We can change these terms. The date at the top of this page shows the last change.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      {
        heading: "The data we keep",
        body: [
          "Your email address and your name.",
          "The profiles that you add: name, date of birth, sex and ancestry.",
          "The report files that you upload, and the values that we read from them.",
          "When a file has a page with an identity document, we do not keep that page.",
          "A record of each payment: the pack, the amount, the date, the status and the payment id. We do not keep card or bank details.",
        ],
      },
      {
        heading: "Family members",
        body: [
          "When you add a family member, you confirm that you have their permission to add their reports. MediWise stores the date of that confirmation with the profile. You can remove a family profile on the Profiles page at any time. This also deletes the reports of that profile.",
        ],
      },
      {
        heading: "Children",
        body: [
          "A profile with an age under 18 needs one more confirmation. You confirm that you are the parent or guardian of the child. MediWise calculates the age from the date of birth. MediWise stores the date of that confirmation with the profile.",
        ],
      },
      {
        heading: "Why we keep it",
        body: [
          "We use your data to read your reports, to show your trends and to count your report credits.",
          "We do not sell your data. We do not show advertisements.",
        ],
      },
      {
        heading: "Who else processes your data",
        body: [
          "Supabase keeps your account, your profiles, your reports and your files.",
          "Anthropic reads the pages of your reports to copy the values. Anthropic does not use this data to train its models.",
          "Cashfree Payments processes your payments and gets your email address.",
          "Render and Cloudflare host the MediWise servers.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "To get a copy of your data, go to Settings and download your data.",
          "To delete your data, go to Settings and delete your account. This deletes your profiles, reports and files.",
          "We keep payment records after you delete your account, because tax law requires them.",
        ],
      },
      {
        heading: "Deletion records",
        body: [
          "When you delete your account, MediWise keeps one deletion record. The record has the time and the number of profiles, reports and files that we deleted. It has a one-way code made from your account ID, not your name or email address. It has no report values. We keep each record for at least one year. Your data download does not include these records.",
        ],
      },
    ],
  },
  refunds: {
    title: "Refund policy",
    sections: [
      {
        heading: "Credits you did not use",
        body: [
          "You can get a refund for a report credit that you did not use.",
          "Ask for the refund within 7 days of the payment.",
          "We refund each credit at the price per credit of its pack.",
          "We do not refund a credit that MediWise used to read a report.",
        ],
      },
      {
        heading: "How to ask for a refund",
        body: [
          `Send an email to ${contact.email}.`,
          "Write the email address of your account and the date of the payment.",
          "We send the refund to the payment method that you used. Your bank can take up to 7 working days to show it.",
        ],
      },
      {
        heading: "Reports that we cannot read",
        body: [
          "When we cannot read a report, we return its credit to your account. You can use that credit for a different report.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact",
    sections: [
      {
        heading: "Contact MediWise",
        body: [
          `Email: ${contact.email}`,
          `Business: ${contact.businessName}`,
          `Address: ${contact.address}`,
          "We reply to each email within 2 working days.",
        ],
      },
    ],
  },
};
