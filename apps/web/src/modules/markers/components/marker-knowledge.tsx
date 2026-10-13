import { useT } from "@/common/hooks/use-locale";
import type { MarkerDetail } from "../types";

type MarkerKnowledgeProps = {
  knowledge: MarkerDetail["knowledge"];
};

export function MarkerKnowledge({ knowledge }: MarkerKnowledgeProps) {
  const t = useT();
  const blocks = [
    { title: t.markers.knowledge.whatItIs, body: knowledge.whatItIs },
    { title: t.markers.knowledge.whyItMatters, body: knowledge.whyItMatters },
    { title: t.markers.knowledge.whatMovesIt, body: knowledge.whatMovesIt },
  ];
  return (
    <div className="max-w-measure space-y-6">
      {blocks.map((block) => (
        <div key={block.title} className="space-y-1.5">
          <h3 className="font-semibold">{block.title}</h3>
          <p className="leading-7">{block.body}</p>
        </div>
      ))}
    </div>
  );
}
