"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending }: { children: string; pending: string }) {
  const status = useFormStatus();
  return (
    <button type="submit" className="button" disabled={status.pending}>
      {status.pending ? pending : children}
    </button>
  );
}
