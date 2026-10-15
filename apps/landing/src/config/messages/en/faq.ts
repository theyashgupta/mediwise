export const faq = {
  eyebrow: "FAQ",
  title: "Questions people ask",
  upload: {
    question: "What can I upload?",
    answer: (maxFiles: number, fileMb: number, totalMb: number) => [
      `Upload a PDF, or photos in JPG, PNG, HEIC or WebP. You can add up to ${maxFiles} files in one report.`,
      `Each file can be up to ${fileMb} MB. All the files together can be up to ${totalMb} MB.`,
    ],
  },
  labs: {
    question: "Which labs does MediWise read?",
    answer: (markers: number) => [
      `MediWise reads reports from any lab. It matches each printed test name to the ${markers} markers in its catalog.`,
      "A test name that it does not know shows as not recognised.",
    ],
  },
  accuracy: {
    question: "How accurate is it?",
    answer: [
      "An AI model copies the values from your report. Fixed rules then score them, so the same values always give the same score.",
      "Each range cites a published source, such as guidelines from ADA, ICMR or KDIGO.",
      "MediWise can misread a value. Compare each value with your printed report.",
    ],
  },
  diagnosis: {
    question: "Is this a diagnosis?",
    answer: (disclaimer: string) => [
      `No. ${disclaimer}`,
      "Take your report and the questions from MediWise to your doctor.",
    ],
  },
  data: {
    question: "How do you store my data?",
    answer: [
      "We store your reports and results on Supabase servers in Mumbai. Your files are private to your account.",
      "To read a report, MediWise sends its pages to an AI model made by Anthropic.",
      "MediWise removes identity pages, such as Aadhaar or PAN cards, when it reads your files. You can delete a report or your account at any time.",
    ],
  },
  refund: {
    question: "Can I get a refund?",
    answer: [
      "Yes, for a credit that you did not use. Ask for the refund within 7 days of the payment.",
      "We do not refund a credit that MediWise used to read a report.",
    ],
  },
  family: {
    question: "Can I add my family?",
    answer: (maxProfiles: number) => [
      `Yes. Make a profile for each person, up to ${maxProfiles} profiles.`,
      "Each profile has its own age, sex and ancestry, so each person gets their own ranges.",
    ],
  },
};
