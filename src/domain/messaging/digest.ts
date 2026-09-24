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

type Arrival = {
  id: string;
  guestName: string;
  propertyId: string;
  propertyName: string;
  arrival: Date;
  preparation: { done: number; total: number; hasChecklist: boolean };
};

const moment = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// Email-resumen al host: texto plano, para copiar cada mensaje tal cual al chat de Airbnb,
// seguido de las llegadas con el piso sin preparar.
export function digestEmail(
  notify: Item[],
  remind: Item[],
  origin: string,
  arrivals: Arrival[] = []
): { subject: string; text: string } {
  const items = [...notify.map((m) => ({ m, late: false })), ...remind.map((m) => ({ m, late: true }))];
  const [only] = items;
  const subject =
    items.length + arrivals.length > 1
      ? [
          items.length && plural(items.length, "mensaje por enviar", "mensajes por enviar"),
          arrivals.length && plural(arrivals.length, "piso por preparar", "pisos por preparar"),
        ].filter(Boolean).join(" y ")
      : only
        ? `${only.late ? "Sigue sin enviar" : "Por enviar"}: ${only.m.name} para ${only.m.reservation.guestName}`
        : `Por preparar: ${arrivals[0].propertyName} para ${arrivals[0].guestName}`;

  const intro = [
    items.length === 1 && "Toca pegar este mensaje en el chat de Airbnb. Cuando lo hagas, márcalo como enviado en el gestor.",
    items.length > 1 &&
      `Toca pegar estos ${items.length} mensajes en el chat de Airbnb. Cuando lo hagas, márcalos como enviados en el gestor.`,
    arrivals.length && `${arrivals.length === 1 ? "Una llegada tiene" : `${arrivals.length} llegadas tienen`} el piso sin preparar.`,
  ].filter(Boolean).join("\n");

  const messageBlocks = items.map(({ m, late }) =>
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

  const arrivalBlocks = arrivals.map((a) => {
    const { done, total, hasChecklist } = a.preparation;
    return [
      `PREPARAR · ${a.propertyName} para ${a.guestName}`,
      `Llega el ${moment.format(a.arrival)} y ${hasChecklist ? `van ${done} de ${total} tareas` : "el piso no tiene lista de preparación"}.`,
      hasChecklist ? `Preparar: ${origin}/reservas/${a.id}/preparar` : `Crear la lista: ${origin}/pisos/${a.propertyId}`,
    ].join("\n");
  });

  return { subject, text: [intro, ...messageBlocks, ...arrivalBlocks].join("\n\n————————————\n\n") };
}
