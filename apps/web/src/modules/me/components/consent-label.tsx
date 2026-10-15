import type { RequiredConsentKind } from "@mediwise/shared";
import { Link } from "@tanstack/react-router";
import { useT } from "@/common/hooks/use-locale";

type ConsentLabelProps = {
  kind: RequiredConsentKind;
};

export function ConsentLabel({ kind }: ConsentLabelProps) {
  const t = useT().me.consent;
  const [before, link, after, to] =
    kind === "terms"
      ? [t.termsBefore, t.termsLink, t.termsAfter, "/terms"]
      : [t.healthBefore, t.healthLink, t.healthAfter, "/privacy"];
  return (
    <span>
      {before}
      <Link to={to} target="_blank" className="font-medium underline underline-offset-4">
        {link}
      </Link>
      {after}
    </span>
  );
}
