"use client";

import { ChevronDown } from "lucide-react";
import { Accordion } from "radix-ui";

export type Question = { key: string; question: string; html: string };

export function FaqList({ questions }: { questions: Question[] }) {
  return (
    <Accordion.Root type="single" collapsible className="divide-y rounded-xl border bg-card">
      {questions.map((item) => (
        <Accordion.Item key={item.key} value={item.key}>
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 md:px-6">
              {item.question}
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            forceMount
            className="px-5 pb-5 text-muted-foreground data-[state=closed]:hidden md:px-6"
          >
            <div className="space-y-2" dangerouslySetInnerHTML={{ __html: item.html }} />
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
