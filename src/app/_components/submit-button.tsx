"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending, skew = false }: { children: string; pending: string; skew?: boolean }) {
  const status = useFormStatus();
  return (
    <button type="submit" className={`button${skew ? " button-skew" : ""}`} disabled={status.pending}>
      {status.pending ? pending : children}
    </button>
  );
}
