import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getIntlTag, useT } from "@/common/hooks/use-locale";
import { Button } from "@/components/ui/button";

type ConsentPromptProps = {
  permissionNames: string[];
  guardianNames: string[];
  confirming: boolean;
  error?: string;
  onConfirm: () => void;
};

function ConsentLine({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 accent-primary"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {children}
    </label>
  );
}

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
          <ConsentLine checked={permission} onChange={setPermission}>
            {text.permission(names.format(permissionNames))}
          </ConsentLine>
        )}
        {guardianNames.length > 0 && (
          <ConsentLine checked={guardian} onChange={setGuardian}>
            {text.guardian(names.format(guardianNames))}
          </ConsentLine>
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
