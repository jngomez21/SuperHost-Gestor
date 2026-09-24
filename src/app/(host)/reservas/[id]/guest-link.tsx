"use client";

import { useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { regenerateGuestTokenAction } from "../actions";

// El enlace de la página del huésped (ADR-007): va en la bienvenida, y aquí siempre está a mano
// por si la reserva no programó bienvenida o hay que reenviarlo.
export function GuestLink({ reservationId, link, guestFirstName, finished }: {
  reservationId: string;
  link: string;
  guestFirstName: string;
  finished: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setNote("Copiado. Pégalo en el chat de Airbnb.");
    } catch {
      setNote("No se pudo copiar: mantén pulsado el enlace para copiarlo a mano.");
    }
  }

  return (
    <section className="log" aria-labelledby="guest-link-title">
      <h2 id="guest-link-title" className="section-title">Enlace del huésped</h2>
      <p className="section-lead">
        {finished
          ? `La estancia terminó: el enlace ya solo le agradece a ${guestFirstName} y le invita a dejar la reseña.`
          : `Va en la bienvenida. Con él, ${guestFirstName} ve su estancia hasta la hora de salida: dirección, cómo entrar y wifi.`}
      </p>
      <p className="bubble">{link}</p>
      <div className="msg-actions">
        <button type="button" className="button" onClick={copy}>Copiar enlace</button>
        <a className="button button-quiet" href={link} target="_blank" rel="noreferrer">Ver lo que ve</a>
        {!confirming && (
          <button type="button" className="link-button link-button-danger" onClick={() => setConfirming(true)}>
            Regenerar
          </button>
        )}
      </div>
      <p className="msg-note" aria-live="polite">{note}</p>

      {confirming && (
        <div className="msg-confirm">
          <p>
            El enlace actual dejará de funcionar al instante. Tendrás que mandarle el nuevo por Airbnb:
            los mensajes ya enviados o editados conservan el viejo.
          </p>
          <div className="msg-actions">
            <form action={regenerateGuestTokenAction.bind(null, reservationId)}>
              <SubmitButton pending="Regenerando…">Sí, regenerar enlace</SubmitButton>
            </form>
            <button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>Volver</button>
          </div>
        </div>
      )}
    </section>
  );
}
