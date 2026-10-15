import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { CheckboxLine } from "@/common/components/checkbox-line";
import { Button } from "@/components/ui/button";

type ConsentPromptProps = {
  permissionNames: string[];
  guardianNames: string[];
  confirming: boolean;
  error?: string;
  onConfirm: () => void;
};

export function ConsentPrompt({
  permissionNames,
  guardianNames,
  confirming,
  error,
  onConfirm,
}: ConsentPromptProps) {
  const t = useT();
  const text = t.profiles.consent;
  const names = new Intl.ListFormat(getIntlTag(), { type: "conjunction" });
  const [permission, setPermission] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const ready =
    (permissionNames.length === 0 || permission) && (guardianNames.length === 0 || guardian);

  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-medium">{text.title}</h2>
          <p className="text-sm text-muted-foreground">
            {text.bodyBefore}{" "}
            <Link to="/profiles" className="underline underline-offset-4">
              {text.bodyLink}
            </Link>{" "}
            {text.bodyAfter}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {permissionNames.length > 0 && (
          <CheckboxLine className="text-sm" checked={permission} onChange={setPermission}>
            {text.permission(names.format(permissionNames))}
          </CheckboxLine>
        )}
        {guardianNames.length > 0 && (
          <CheckboxLine className="text-sm" checked={guardian} onChange={setGuardian}>
            {text.guardian(names.format(guardianNames))}
          </CheckboxLine>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button
        size="sm"
        className="w-full sm:w-fit"
        disabled={!ready || confirming}
        onClick={onConfirm}
      >
        {confirming ? t.profiles.saving : text.confirm}
      </Button>
    </section>
  );
}
