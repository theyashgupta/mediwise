import { ChevronDown } from "lucide-react";
import { useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRevealHash } from "../hooks/use-reveal-hash";

type SectionNavProps = {
  hash: string;
  sections: { id: string; title: string }[];
};

export function SectionNav({ hash, sections }: SectionNavProps) {
  const t = useT();
  useRevealHash(hash);
  return (
    <nav
      aria-label={t.report.sections.nav}
      className="md:sticky md:top-12 md:z-20 md:-mx-8 md:border-b md:bg-background/95 md:px-8 md:py-2 md:backdrop-blur-md"
    >
      <ul className="hidden gap-1 overflow-x-auto md:flex">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <Button asChild size="sm" variant="ghost">
              <a href={`#${section.id}`}>{section.title}</a>
            </Button>
          </li>
        ))}
      </ul>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between md:hidden">
            {t.report.sections.goTo}
            <ChevronDown aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onCloseAutoFocus={(event) => event.preventDefault()}>
          {sections.map((section) => (
            <DropdownMenuItem key={section.id} asChild>
              <a href={`#${section.id}`}>{section.title}</a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
