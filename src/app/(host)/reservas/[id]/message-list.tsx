"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/app/_components/field";
import { FilledText } from "@/app/_components/filled-text";
import { SubmitButton } from "@/app/_components/submit-button";
import { formatDateTime, MESSAGE_STATUS_LABEL } from "@/app/_lib/format";
import type { MessageStatus } from "@/domain/messaging/schedule";
import { VARIABLES, type Variable } from "@/domain/messaging/template";
import { cancelMessageAction, editMessageAction, markMessageSentAction, type FormState } from "../actions";

type Message = {
  id: string;
  name: string;
  sendAt: Date;
  sentAt: Date | null;
  status: MessageStatus;
  text: string;
  missing: Variable[];
  edited: boolean;
};

type Props = { reservationId: string; propertyId: string };

export function MessageList({ messages, ...props }: Props & { messages: Message[] }) {
  return (
    <ol className="roadmap">
      {messages.map((message) => <MessageStep key={message.id} message={message} {...props} />)}
    </ol>
  );
}

function MessageStep({ reservationId, propertyId, message }: Props & { message: Message }) {
  const [mode, setMode] = useState<"view" | "edit" | "cancel">("view");
  const [note, setNote] = useState("");
  const [state, edit] = useActionState<FormState, FormData>(async (previous, formData) => {
    const result = await editMessageAction(reservationId, message.id, previous, formData);
    if (!result) setMode("view");
    return result;
  }, null);
  const open = message.status === "due" || message.status === "scheduled";
  const shown = message.sentAt ?? message.sendAt;
  const bodyId = `message-${message.id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.text);
      setNote("Copiado. Pégalo en el chat de Airbnb y márcalo como enviado.");
    } catch {
      setNote("No se pudo copiar: mantén pulsado el texto para copiarlo a mano.");
    }
  }

  return (
    <li id={`mensaje-${message.id}`} className={`msg msg-${message.status}`}>
      <p className="msg-head">
        <time className="log-time" dateTime={shown.toISOString()}>{formatDateTime(shown)}</time>
        <span className={`chip chip-${message.status}`}>{MESSAGE_STATUS_LABEL[message.status]}</span>
        {message.edited && <span className="chip">Editado</span>}
      </p>
      <h3 className="msg-name">{message.name}</h3>

      {open && mode === "edit" ? (
        <form action={edit} className="note-form" noValidate>
          <Field
            name={bodyId}
            label="Texto del mensaje"
            hint="Se pegará tal cual: ya no se rellena con los datos del piso ni sigue a la plantilla."
            error={state?.errors.body ?? state?.errors.form}
          >
            <textarea id={bodyId} name="body" className="input" rows={8} maxLength={2000} defaultValue={state?.values.body ?? message.text} autoFocus />
          </Field>
          <div className="msg-actions">
            <SubmitButton pending="Guardando…">Guardar mensaje</SubmitButton>
            <button type="button" className="button button-quiet" onClick={() => setMode("view")}>Volver</button>
          </div>
        </form>
      ) : (
        message.status !== "cancelled" && <p className="bubble"><FilledText text={message.text} /></p>
      )}

      {open && mode === "view" && (
        <>
          {message.missing.length > 0 && (
            <p className="msg-missing">
              Falta {message.missing.map((v) => VARIABLES[v]).join(", ")}.{" "}
              <Link href={`/pisos/${propertyId}`}>Complétalo en el piso</Link> o edita el mensaje antes de copiarlo.
            </p>
          )}
          <div className="msg-actions">
            <button type="button" className={`button${message.status === "due" ? "" : " button-quiet"}`} onClick={copy}>
              Copiar texto
            </button>
            <form action={markMessageSentAction.bind(null, reservationId, message.id)}>
              <SubmitButton pending="Guardando…" quiet>Marcar enviado</SubmitButton>
            </form>
            <button type="button" className="link-button" onClick={() => setMode("edit")}>Editar</button>
            <button type="button" className="link-button link-button-danger" onClick={() => setMode("cancel")}>No enviar</button>
          </div>
          <p className="msg-note" aria-live="polite">{note}</p>
        </>
      )}

      {open && mode === "cancel" && (
        <div className="msg-confirm">
          <p>Dejará de estar pendiente y no se puede deshacer.</p>
          <div className="msg-actions">
            <form action={cancelMessageAction.bind(null, reservationId, message.id)}>
              <button type="submit" className="button button-danger">Sí, no enviarlo</button>
            </form>
            <button type="button" className="button button-quiet" onClick={() => setMode("view")}>Volver</button>
          </div>
        </div>
      )}
    </li>
  );
}
