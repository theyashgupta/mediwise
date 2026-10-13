import { FaqList, type Question } from "@/components/faq-list";
import { SectionHeader } from "@/components/section-header";
import { facts } from "@/lib/facts";
import { disclaimer } from "@/lib/site";

const questions: Question[] = [
  {
    question: "What can I upload?",
    answer: [
      `Upload a PDF, or photos in JPG, PNG, HEIC or WebP. You can add up to ${facts.maxFiles} files in one report.`,
      `Each file can be up to ${facts.maxFileMb} MB. All the files together can be up to ${facts.maxTotalMb} MB.`,
    ],
  },
  {
    question: "Which labs does MediWise read?",
    answer: [
      `MediWise reads reports from any lab. It matches each printed test name to the ${facts.markers} markers in its catalog.`,
      "A test name that it does not know shows as not recognised.",
    ],
  },
  {
    question: "How accurate is it?",
    answer: [
      "Claude, an AI model, copies the values from your report. Fixed rules then score them, so the same values always give the same score.",
      "Each range cites a published source, such as guidelines from ADA, ICMR or KDIGO.",
      "MediWise can misread a value. Compare each value with your printed report.",
    ],
  },
  {
    question: "Is this a diagnosis?",
    answer: [
      `No. ${disclaimer}`,
      "Take your report and the questions from MediWise to your doctor.",
    ],
  },
  {
    question: "How do you store my data?",
    answer: [
      "We store your reports and results on Supabase servers in Mumbai. Your files are private to your account.",
      "To read a report, MediWise sends its pages to Claude, made by Anthropic.",
      "MediWise removes identity pages, such as Aadhaar or PAN cards, when it reads your files. You can delete a report or your account at any time.",
    ],
  },
  {
    question: "Can I get a refund?",
    answer: [
      "Yes, for a credit that you did not use. Ask for the refund within 7 days of the payment.",
      "We do not refund a credit that MediWise used to read a report.",
    ],
  },
  {
    question: "Can I add my family?",
    answer: [
      `Yes. Make a profile for each person, up to ${facts.maxProfiles} profiles.`,
      "Each profile has its own age, sex and ancestry, so each person gets their own ranges.",
    ],
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t bg-sidebar">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader id="faq-title" eyebrow="FAQ" title="Questions people ask" />
        <FaqList questions={questions} />
      </div>
    </section>
  );
}
