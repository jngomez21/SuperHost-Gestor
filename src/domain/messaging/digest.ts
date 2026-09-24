import { VARIABLES, type Variable } from "./template.ts";

type Item = {
  id: string;
  name: string;
  sendAt: Date;
  text: string;
  missing: Variable[];
  reservation: { id: string; guestName: string };
  property: { name: string };
};

const moment = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

// Email-resumen al host: texto plano, para copiar cada mensaje tal cual al chat de Airbnb.
export function digestEmail(notify: Item[], remind: Item[], origin: string): { subject: string; text: string } {
  const items = [...notify.map((m) => ({ m, late: false })), ...remind.map((m) => ({ m, late: true }))];
  const [only] = items;
  const subject =
    items.length === 1
      ? `${only.late ? "Sigue sin enviar" : "Por enviar"}: ${only.m.name} para ${only.m.reservation.guestName}`
      : `${items.length} mensajes por enviar`;

  const intro =
    items.length === 1
      ? "Toca pegar este mensaje en el chat de Airbnb. Cuando lo hagas, márcalo como enviado en el gestor."
      : `Toca pegar estos ${items.length} mensajes en el chat de Airbnb. Cuando lo hagas, márcalos como enviados en el gestor.`;

  const blocks = items.map(({ m, late }) =>
    [
      `${late ? "RECORDATORIO · " : ""}${m.name} para ${m.reservation.guestName} (${m.property.name})`,
      `Toca desde el ${moment.format(m.sendAt)}${late ? " y sigue sin enviar" : ""}.`,
      ...(m.missing.length ? [`Falta en el piso: ${m.missing.map((v) => VARIABLES[v]).join(", ")}. Complétalo antes de copiarlo.`] : []),
      "",
      m.text,
      "",
      `Marcar como enviado: ${origin}/reservas/${m.reservation.id}#mensaje-${m.id}`,
    ].join("\n")
  );

  return { subject, text: [intro, ...blocks].join("\n\n————————————\n\n") };
}
