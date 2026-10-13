import { ExternalLink } from "lucide-react";

type SourceListProps = {
  sources: { id: string; title: string; year: number; url?: string }[];
};

export function SourceList({ sources }: SourceListProps) {
  return (
    <ul className="space-y-2 text-sm">
      {sources.map((source) => (
        <li key={source.id}>
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-start gap-1.5 underline-offset-4 hover:underline"
            >
              {source.title} ({source.year})
              <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <span>
              {source.title} ({source.year})
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
