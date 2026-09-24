import { and, asc, eq, inArray, isNull, lte, type SQL } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { sendEmail } from "@/infrastructure/email";
import { usersTable } from "@/infrastructure/auth-schema";
import { messageTemplateTable, propertyTable, reservationMessageTable, reservationTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { digestEmail } from "@/domain/messaging/digest";
import { dispatchPlan, messageStatus, planMessages } from "@/domain/messaging/schedule";
import { messageValues, render, STANDARD_TEMPLATES, validateMessage, validateTemplate } from "@/domain/messaging/template";
import { ownedPropertyIds } from "./properties";

const TEMPLATE_NOT_FOUND = { ok: false as const, errors: { form: "Esa plantilla no existe." } };
const MESSAGE_CLOSED = { ok: false as const, errors: { form: "Este mensaje ya no se puede cambiar." } };

function ownedTemplate(hostId: string, id: string) {
  return and(eq(messageTemplateTable.id, id), eq(messageTemplateTable.hostId, hostId));
}

// Solo se tocan mensajes del host que siguen abiertos: sin enviar, sin cancelar y de una reserva activa.
function openMessage(hostId: string, messageId: string) {
  return and(
    eq(reservationMessageTable.id, messageId),
    isNull(reservationMessageTable.sentAt),
    isNull(reservationMessageTable.cancelledAt),
    inArray(
      reservationMessageTable.reservationId,
      db
        .select({ id: reservationTable.id })
        .from(reservationTable)
        .where(and(isNull(reservationTable.cancelledAt), inArray(reservationTable.propertyId, ownedPropertyIds(hostId))))
    )
  );
}

// ---------- Plantillas ----------

export function listTemplates(hostId: string) {
  return db
    .select()
    .from(messageTemplateTable)
    .where(eq(messageTemplateTable.hostId, hostId))
    .orderBy(
      asc(messageTemplateTable.trigger),
      asc(messageTemplateTable.dayOffset),
      asc(messageTemplateTable.sendTime),
      asc(messageTemplateTable.createdAt)
    );
}

export async function getTemplate(hostId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db.select().from(messageTemplateTable).where(ownedTemplate(hostId, id));
  return row ?? null;
}

export async function createStandardTemplates(hostId: string) {
  if ((await listTemplates(hostId)).length > 0) return false;
  await db.insert(messageTemplateTable).values(STANDARD_TEMPLATES.map((template) => ({ ...template, hostId })));
  return true;
}

export async function createTemplate(hostId: string, raw: Raw) {
  const input = validateTemplate(raw);
  if (!input.ok) return input;
  const [row] = await db
    .insert(messageTemplateTable)
    .values({ ...input.value, hostId })
    .returning({ id: messageTemplateTable.id });
  return { ok: true as const, value: row };
}

// Los mensajes ya programados conservan su nombre y su hora; el texto sí sigue a la plantilla.
export async function updateTemplate(hostId: string, id: string, raw: Raw) {
  const input = validateTemplate(raw);
  if (!input.ok) return input;
  if (!isUuid(id)) return TEMPLATE_NOT_FOUND;
  const [row] = await db
    .update(messageTemplateTable)
    .set(input.value)
    .where(ownedTemplate(hostId, id))
    .returning({ id: messageTemplateTable.id });
  return row ? { ok: true as const, value: row } : TEMPLATE_NOT_FOUND;
}

// Los mensajes que usaban la plantilla tal cual se van con ella; los enviados y los
// editados a mano se quedan con su texto.
export async function removeTemplate(hostId: string, id: string) {
  if (!isUuid(id)) return false;
  const [, removed] = await db.batch([
    db
      .delete(reservationMessageTable)
      .where(
        and(
          isNull(reservationMessageTable.body),
          inArray(
            reservationMessageTable.templateId,
            db.select({ id: messageTemplateTable.id }).from(messageTemplateTable).where(ownedTemplate(hostId, id))
          )
        )
      ),
    db.delete(messageTemplateTable).where(ownedTemplate(hostId, id)).returning({ id: messageTemplateTable.id }),
  ]);
  return removed.length > 0;
}

// ---------- Mensajes de una reserva ----------

export async function messagesToSchedule(
  hostId: string,
  stay: { id: string; checkIn: string; checkOut: string },
  started: boolean,
  now: Date
) {
  const templates = await listTemplates(hostId);
  return planMessages(templates, stay, started, now).map(({ template, sendAt }) => ({
    reservationId: stay.id,
    templateId: template.id,
    name: template.name,
    sendAt,
  }));
}

async function readMessages(where: SQL | undefined, now: Date) {
  const rows = await db
    .select({
      message: reservationMessageTable,
      template: messageTemplateTable,
      reservation: reservationTable,
      property: propertyTable,
    })
    .from(reservationMessageTable)
    .innerJoin(reservationTable, eq(reservationMessageTable.reservationId, reservationTable.id))
    .innerJoin(propertyTable, eq(reservationTable.propertyId, propertyTable.id))
    .leftJoin(messageTemplateTable, eq(reservationMessageTable.templateId, messageTemplateTable.id))
    .where(where)
    .orderBy(asc(reservationMessageTable.sendAt), asc(reservationMessageTable.createdAt));

  return rows.map(({ message, template, reservation, property }) => {
    // La BD garantiza que hay texto guardado o plantilla de la que rellenarlo.
    const filled = message.body === null && template ? render(template.body, messageValues(reservation, property)) : null;
    const reservationCancelled = reservation.cancelledAt !== null;
    return {
      ...message,
      hostId: property.hostId,
      reservationCancelled,
      reservation: { id: reservation.id, guestName: reservation.guestName },
      property: { id: property.id, name: property.name },
      status: messageStatus({ ...message, reservationCancelled }, now),
      text: message.body ?? filled?.text ?? "",
      missing: filled?.missing ?? [],
      edited: message.body !== null && message.sentAt === null,
    };
  });
}

export async function listMessages(hostId: string, reservationId: string, now = new Date()) {
  if (!isUuid(reservationId)) return [];
  return readMessages(
    and(eq(propertyTable.hostId, hostId), eq(reservationMessageTable.reservationId, reservationId)),
    now
  );
}

export async function listDueMessages(hostId: string, now = new Date()) {
  const pending = await readMessages(
    and(eq(propertyTable.hostId, hostId), isNull(reservationMessageTable.sentAt), isNull(reservationMessageTable.cancelledAt)),
    now
  );
  return pending.filter((message) => message.status === "due");
}

// La llama QStash cada 5 min. Un email por host solo si hay algo: lo que acaba de tocar
// y, una vez, lo que sigue sin enviar horas después del primer aviso.
export async function dispatchDue(origin: string, now = new Date()) {
  const t = reservationMessageTable;
  const pending = await readMessages(
    and(isNull(t.sentAt), isNull(t.cancelledAt), isNull(t.remindedAt), lte(t.sendAt, now)),
    now
  );
  const plan = dispatchPlan(pending, now);
  const hostIds = [...new Set([...plan.notify, ...plan.remind].map((m) => m.hostId))];
  if (hostIds.length === 0) return { notified: 0, reminded: 0 };

  const hosts = await db.select().from(usersTable).where(inArray(usersTable.id, hostIds));
  let notified = 0;
  let reminded = 0;
  for (const host of hosts) {
    if (!host.email) continue;
    const mine = <M extends { hostId: string }>(list: M[]) => list.filter((m) => m.hostId === host.id);

    // Se marcan antes de enviar: si QStash repite la llamada, nada se avisa dos veces.
    const [claimedNotify, claimedRemind] = await db.batch([
      db
        .update(t)
        .set({ notifiedAt: now })
        .where(and(inArray(t.id, mine(plan.notify).map((m) => m.id)), isNull(t.notifiedAt)))
        .returning({ id: t.id }),
      db
        .update(t)
        .set({ remindedAt: now })
        .where(and(inArray(t.id, mine(plan.remind).map((m) => m.id)), isNull(t.remindedAt)))
        .returning({ id: t.id }),
    ]);
    const claimed = (list: { id: string }[]) => new Set(list.map((row) => row.id));
    const notify = mine(plan.notify).filter((m) => claimed(claimedNotify).has(m.id));
    const remind = mine(plan.remind).filter((m) => claimed(claimedRemind).has(m.id));
    if (notify.length + remind.length === 0) continue;

    const { subject, text } = digestEmail(notify, remind, origin);
    try {
      await sendEmail(host.email, subject, text);
    } catch (error) {
      // Se desmarcan para que el reintento de QStash vuelva a avisar.
      await db.batch([
        db.update(t).set({ notifiedAt: null }).where(inArray(t.id, notify.map((m) => m.id))),
        db.update(t).set({ remindedAt: null }).where(inArray(t.id, remind.map((m) => m.id))),
      ]);
      throw error;
    }
    notified += notify.length;
    reminded += remind.length;
  }
  return { notified, reminded };
}

export async function editMessage(hostId: string, messageId: string, raw: Raw) {
  const input = validateMessage(raw);
  if (!input.ok) return input;
  if (!isUuid(messageId)) return MESSAGE_CLOSED;
  const [row] = await db
    .update(reservationMessageTable)
    .set({ body: input.value.body })
    .where(openMessage(hostId, messageId))
    .returning({ reservationId: reservationMessageTable.reservationId });
  return row ? { ok: true as const, value: row } : MESSAGE_CLOSED;
}

export async function cancelMessage(hostId: string, messageId: string) {
  if (!isUuid(messageId)) return null;
  const [row] = await db
    .update(reservationMessageTable)
    .set({ cancelledAt: new Date() })
    .where(openMessage(hostId, messageId))
    .returning({ reservationId: reservationMessageTable.reservationId });
  return row ?? null;
}

// Guarda el texto exacto que el host pegó en Airbnb: el historial no cambia aunque luego
// cambien la plantilla o los datos del piso.
export async function markMessageSent(hostId: string, messageId: string, now = new Date()) {
  if (!isUuid(messageId)) return null;
  const [message] = await readMessages(
    and(eq(propertyTable.hostId, hostId), eq(reservationMessageTable.id, messageId)),
    now
  );
  if (!message) return null;
  const [row] = await db
    .update(reservationMessageTable)
    .set({ sentAt: now, body: message.text })
    .where(openMessage(hostId, messageId))
    .returning({ reservationId: reservationMessageTable.reservationId });
  return row ?? null;
}
