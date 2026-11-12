import { cloneElement, type ReactElement, type ReactNode, useId } from "react";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as ShadcnField,
} from "@/components/ui/field";

type ControlProps = {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
};

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactElement<ControlProps>;
  className?: string;
};

export function Field({ label, hint, error, children, className }: FieldProps) {
  const base = useId();
  const controlId = children.props.id ?? `${base}-control`;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy =
    [children.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <ShadcnField data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={controlId}>{label}</FieldLabel>
      {cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : children.props["aria-invalid"],
      })}
      {hint && <FieldDescription id={hintId}>{hint}</FieldDescription>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </ShadcnField>
  );
}
