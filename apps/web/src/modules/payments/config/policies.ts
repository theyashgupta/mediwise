export const contact = {
  brand: "MediWise",
  businessName: "Codegenix",
  proprietor: "Yash Anil Gupta",
  email: "yashguptaab66@gmail.com",
  phone: "+91 94044 12694",
};

const contactLines = [
  `${contact.brand} is a brand of ${contact.businessName}.`,
  `Business: ${contact.businessName}`,
  `Proprietor: ${contact.proprietor}`,
  `Email: ${contact.email}`,
  `Phone: ${contact.phone}`,
];

const contactSection = { heading: "Contact", body: contactLines };

export const washingtonSectionId = "washington";

export type PolicyPage = "terms" | "privacy" | "refunds" | "contact";

type Policy = { title: string; sections: { id?: string; heading: string; body: string[] }[] };

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
        heading: "Not a medical device",
        body: [
          "MediWise gives information only. It does not diagnose, treat or monitor a disease.",
          "MediWise is not a medical device.",
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
      contactSection,
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Your email address and your name. When you sign in with Google, Google sends us your name and email address.",
          "The profiles that you add: name, date of birth, sex and ancestry.",
          "The report files that you upload, and the values that MediWise reads from them.",
          "When a file has a page with an identity document, we do not keep that page.",
          "The notes that you write and the questions that you ask the assistant, with their answers.",
          "Your consent records: the consent, the time, the policy version and a one-way code made from your browser name.",
          "A record of each payment: the pack, the amount, the date, the status and the payment ID.",
          "We do not collect card or bank details.",
        ],
      },
      {
        heading: "Why we use it",
        body: [
          "We use your data to read your reports, to show your trends and to answer your questions.",
          "We use your email address to sign you in and to send you account emails.",
          "We use payment records to count your report credits and to obey tax law.",
          "We do not sell your data. We do not show advertisements.",
        ],
      },
      {
        heading: "Who receives your data",
        body: [
          "Supabase (India) keeps your account, your profiles, your reports and your files. It also sends account emails.",
          "Render (Singapore) runs the MediWise API. Your data goes through the API when you use the app.",
          "Anthropic (United States) gets the content of your reports to read them and to write text.",
          "Anthropic also gets your questions to the assistant and the stored values of that profile.",
          "Anthropic does not use this content to train its models.",
          "Cashfree Payments (India) processes your payments. It gets your email address.",
          "Resend (United States) delivers the account emails for Supabase. It gets your email address.",
          "Cloudflare (United States) serves the MediWise web app and website from its global network.",
          "We give your data to no other company.",
        ],
      },
      {
        heading: "Where we store it",
        body: [
          "Your files and the database are on Supabase servers in Mumbai, India.",
          "The MediWise API runs on Render servers in Singapore.",
          "Anthropic processes the content of your reports in the United States.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "We keep your reports and profiles until you delete them or you delete your account.",
          "When you delete your account, we delete your files, your data and your sign-in.",
          "We keep payment records after you delete your account, because tax law requires them.",
          "We also keep one deletion record. It has the time and the number of items that we deleted.",
          "The deletion record has a one-way code made from your account ID. It has no name, email address or report value.",
          "We keep each deletion record for at least one year. Your data download does not include these records.",
          "When you clear the assistant chat, we remove the text of the questions and the answers.",
          "We keep the number of questions and their cost, with no text.",
          "When you do not finish an upload, we remove it when it is older than 1 hour.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can see your data in the app.",
          "You can download a copy of your data as a JSON file. Go to Settings.",
          "You can correct your data. Edit it in the app.",
          "You can delete your data. Go to Settings and delete your account.",
          "You can withdraw your consent. To do this, delete your account.",
          "You can also send a request to the email address below. We answer each request within 30 days.",
        ],
      },
      {
        heading: "Consent and how to withdraw it",
        body: [
          "MediWise asks for two separate consents, at sign-up or before your first upload.",
          "First, you confirm that you are 18 or older and that you accept the Terms.",
          "Second, you agree that MediWise stores your health reports and sends their content to Anthropic in the United States.",
          "You cannot upload a report without the second consent.",
          "MediWise stores each consent with the time and the version of this policy.",
          "When this policy changes, MediWise asks for the second consent again before your next upload.",
          "When you add a family member, you confirm that you have their permission to add their reports.",
          "MediWise stores the date of that confirmation with the profile.",
          "To withdraw your consent, delete your account in Settings. This stops all processing and deletes your data.",
          "To remove one family member, remove their profile on the Profiles page. This also deletes the reports of that profile.",
        ],
      },
      {
        heading: "Children",
        body: [
          "You must be 18 or older to make an account.",
          "A profile with an age under 18 needs one more confirmation. You confirm that you are the parent or guardian of the child.",
          "MediWise calculates the age from the date of birth. MediWise stores the date of that confirmation with the profile.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "MediWise uses no analytics, no advertising trackers and no third-party cookies.",
          "The app keeps your sign-in session in the storage of your browser. It also keeps your language and theme there.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Your data goes over an encrypted connection (TLS).",
          "Supabase encrypts the database and the files at rest.",
          "Your files are in private storage. Only a short-lived link from the MediWise API opens a file.",
          "A share link uses a long random code. We keep only a one-way code of it.",
          "Each share link has an end date. You can stop a share link at any time.",
        ],
      },
      {
        heading: "Breaches",
        body: [
          "A breach is when a person gets your data without permission.",
          "When a breach affects your data, we tell you within 72 hours after we learn of it.",
          "We also tell the data protection authority within 72 hours.",
        ],
      },
      {
        heading: "International users: EU and UK",
        body: [
          "This section is for users in the European Union and the United Kingdom.",
          "Your explicit consent is the legal basis for the use of your health data.",
          "Transfers of your data out of your country use the standard contractual clauses.",
          "You can complain to the data protection authority of your country.",
        ],
      },
      {
        id: washingtonSectionId,
        heading: "Washington state consumer health data",
        body: [
          "This section is for consumers in Washington state in the United States.",
          "What we collect: your reports, the values in them, your profiles and your questions to the assistant.",
          "Why we collect it: to read your reports, to show your trends and to answer your questions.",
          "Who receives it: Supabase, Render, Anthropic and Cloudflare, as this policy shows above.",
          "We do not sell consumer health data.",
          "How to withdraw your consent: delete your account in Settings, or send an email to the address below.",
        ],
      },
      {
        heading: "Changes to this policy",
        body: [
          "We can change this policy. The version at the top of this page shows the date of the last change.",
          "When we change this policy, we ask for your health data consent again before your next upload.",
        ],
      },
      {
        heading: "Contact and grievance officer",
        body: [
          ...contactLines,
          `The grievance officer is ${contact.proprietor}. Send a complaint or a request to the email address above.`,
          "We answer each complaint within 30 days.",
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
      contactSection,
    ],
  },
  contact: {
    title: "Contact",
    sections: [
      {
        heading: "Contact MediWise",
        body: [...contactLines, "We reply to each email within 2 working days."],
      },
    ],
  },
};
