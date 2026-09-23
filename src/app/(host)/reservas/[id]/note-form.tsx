"use client";

import { useActionState } from "react";
import { Field } from "@/app/_components/field";
import { SubmitButton } from "@/app/_components/submit-button";
import { addNoteAction, type FormState } from "../actions";

export function NoteForm({ reservationId }: { reservationId: string }) {
  const [state, action] = useActionState<FormState, FormData>(addNoteAction.bind(null, reservationId), null);
  return (
    <form action={action} className="note-form" noValidate>
      <Field name="body" label="Nueva nota" error={state?.errors.body ?? state?.errors.form}>
        <textarea id="body" name="body" className="input" rows={3} defaultValue={state?.values.body} />
      </Field>
      <div>
        <SubmitButton pending="Guardando…">Guardar nota</SubmitButton>
      </div>
    </form>
  );
}
