export const settings = {
  title: "Settings",
  description: "Your account and your own profile.",
  identity: { title: "Identity", description: "The name shown across MediWise." },
  loadError: "We could not load your account.",
  nameSaved: "We saved your name.",
  accountDeleted: "We deleted your account.",
  profile: {
    title: "Your profile",
    description: "Age, sex and ancestry decide which ranges MediWise uses to score your markers.",
  },
  credits: {
    title: "Report credits",
    description: "Each report that MediWise reads uses one report credit.",
    more: "How to get more credits",
  },
  security: { title: "Security", description: "Your password and how you sign in." },
  appearance: { title: "Appearance", description: "MediWise saves this choice on this device." },
  language: {
    title: "Language",
    description: "MediWise saves this choice on this device and in your account.",
  },
  about: {
    title: "About",
    description: (company: string) => `MediWise is a brand of ${company}.`,
    brand: "Brand",
    company: "Company",
    email: "Email",
    policies: "Policies",
  },
  data: {
    title: "Your data",
    description:
      "Download a copy of your profiles, reports, markers and uploaded files, or delete all of it.",
    preparing: "Preparing download",
    download: "Download my data",
    files: "Your uploaded files",
    filesExpire: "Each file link works for 5 minutes. To get new links, download your data again.",
    delete: "Delete account",
  },
  deleteDialog: {
    title: "Delete your account?",
    description:
      "This deletes every profile, report and uploaded file. You cannot undo this. Download your data first if you want a copy.",
    confirm: (word: string) => `Type ${word} to confirm`,
    cancel: "Cancel",
    deleting: "Deleting",
  },
  nameForm: {
    name: "Name",
    email: "Email",
    saving: "Saving",
    save: "Save name",
    nameRequired: "Enter a name",
    nameTooLong: "Enter a name of 80 characters or fewer",
  },
  theme: { label: "Theme", light: "Light", dark: "Dark", system: "Match system" },
};
