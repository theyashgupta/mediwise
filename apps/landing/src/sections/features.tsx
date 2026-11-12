import type { CSSProperties, ReactNode } from "react";
import { SectionHeader } from "@/components/section-header";
import {
  DoctorSummaryArt,
  EpisodeArt,
  FamilyArt,
  FilesArt,
  QuestionsArt,
  SettledArt,
  StudiesArt,
  TrendsArt,
  VignetteDefs,
} from "@/components/vignettes";
import { messages, type Locale } from "@/config/messages";
import { facts } from "@/lib/facts";

type Vignette = { title: string; body: string; note?: string; art: ReactNode };

export function Features({ locale }: { locale: Locale }) {
  const t = messages[locale].features;
  const vignettes: Vignette[] = [
    {
      title: t.files.title(facts.maxFiles),
      body: t.files.body(facts.maxFileMb, facts.maxTotalMb),
      art: <FilesArt />,
    },
    { ...t.studies, art: <StudiesArt /> },
    {
      title: t.family.title,
      body: t.family.body(facts.maxProfiles),
      note: t.family.language,
      art: <FamilyArt />,
    },
    { ...t.doctor, art: <DoctorSummaryArt /> },
    { ...t.questions, art: <QuestionsArt /> },
    {
      title: t.settled.title,
      body: t.settled.body(facts.repeatStudyDays),
      art: <SettledArt />,
    },
    { ...t.episode, art: <EpisodeArt /> },
    { ...t.trends, art: <TrendsArt /> },
  ];
  return (
    <section
      aria-labelledby="features-title"
      className="mx-auto max-w-content px-4 py-12 md:px-8 md:py-20"
    >
      <VignetteDefs />
      <SectionHeader id="features-title" eyebrow={t.eyebrow} title={t.title} />
      <ul className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
        {vignettes.map((item, index) => (
          <li
            key={item.title}
            data-reveal=""
            data-vignette=""
            style={{ "--i": index % 4 } as CSSProperties}
          >
            {item.art}
            <h3 className="mt-4 font-medium">{item.title}</h3>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">{item.body}</p>
            {item.note && (
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{item.note}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
