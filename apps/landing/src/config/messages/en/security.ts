export const security = {
  title: "How MediWise protects your data",
  description:
    "The controls that protect your reports in MediWise, and how to report a vulnerability.",
  intro: "This page lists the controls that protect your reports and your account.",
  items: {
    encryption: {
      title: "Encryption",
      body: "Your data goes over an encrypted connection (TLS). Supabase encrypts the database and the files at rest.",
    },
    storage: {
      title: "Private storage",
      body: "Your files are in private storage. Only a short-lived link from the MediWise API opens a file.",
    },
    trackers: {
      title: "No trackers",
      body: "MediWise uses no analytics, no advertising trackers and no third-party cookies.",
    },
    deletion: {
      title: "Deletion",
      body: "When you delete your account, MediWise deletes your files, your data and your sign-in. Payment records stay for tax law.",
    },
    shareLinks: {
      title: "Hashed share links",
      body: "A share link uses a long random code. MediWise keeps only a one-way code of it. Each link has an end date.",
    },
    supplyChain: {
      title: "Supply-chain scan",
      body: "On each change and each day, a scan checks the code and its packages for signs of known supply-chain worms.",
    },
  },
  report: {
    title: "Report a vulnerability",
    body: "Do not open a public issue. Follow the steps in SECURITY.md to report the problem in private.",
    link: "Read SECURITY.md",
  },
};
