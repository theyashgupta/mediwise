import type { MarkerDetail } from "../types";

type MarkerKnowledgeProps = {
  knowledge: MarkerDetail["knowledge"];
};

export function MarkerKnowledge({ knowledge }: MarkerKnowledgeProps) {
  const blocks = [
    { title: "What it is", body: knowledge.whatItIs },
    { title: "Why it matters", body: knowledge.whyItMatters },
    { title: "What moves it", body: knowledge.whatMovesIt },
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
