import { cloneElement, type InputHTMLAttributes, type ReactElement } from "react";

export function Field({ name, label, hint, error, children }: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactElement<InputHTMLAttributes<HTMLInputElement>>;
}) {
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={name}>{label}</label>
      {hint && <p className="field-hint" id={`${name}-hint`}>{hint}</p>}
      {cloneElement(children, { "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error && <p className="field-error" id={`${name}-error`} role="alert">{error}</p>}
    </div>
  );
}
