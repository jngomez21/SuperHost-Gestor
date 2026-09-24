"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending, skew = false, quiet = false }: {
  children: string;
  pending: string;
  skew?: boolean;
  quiet?: boolean;
}) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className={`button${skew ? " button-skew" : ""}${quiet ? " button-quiet" : ""}`}
      disabled={status.pending}
    >
      {status.pending ? pending : children}
    </button>
  );
}
