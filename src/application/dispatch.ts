import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { sendEmail } from "@/infrastructure/email";
import { usersTable } from "@/infrastructure/auth-schema";
import { propertyTable, reservationMessageTable, reservationTable } from "@/infrastructure/schema";
import { prepWarnings } from "@/domain/housekeeping/checklist";
import { digestEmail } from "@/domain/messaging/digest";
import { dispatchPlan } from "@/domain/messaging/schedule";
import { addDays, localInstant, todayInColombia } from "@/domain/reservation/status";
import { listPreparations } from "./housekeeping";
import { undispatchedMessages } from "./messaging";

// Reservas alrededor de hoy: las llegadas que pueden necesitar aviso y las salidas anteriores
// que deciden cuándo avisar (nunca antes de 24 h de la llegada).
function staysAround(now: Date) {
  const today = todayInColombia(now);
  const r = reservationTable;
  return db
    .select({
      id: r.id,
      propertyId: r.propertyId,
      guestName: r.guestName,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      cancelledAt: r.cancelledAt,
      prepWarnedAt: r.prepWarnedAt,
      hostId: propertyTable.hostId,
      propertyName: propertyTable.name,
      checkInTime: propertyTable.checkInTime,
      checkOutTime: propertyTable.checkOutTime,
    })
    .from(r)
    .innerJoin(propertyTable, eq(r.propertyId, propertyTable.id))
    .where(and(isNull(r.cancelledAt), gte(r.checkOut, addDays(today, -1)), lte(r.checkIn, addDays(today, 2))));
}

// La llama QStash cada 5 min. Un email por host solo si hay algo: los mensajes que acaban de
// tocar, una vez los que siguen sin enviar horas después, y las llegadas con el piso sin preparar.
export async function dispatchDue(origin: string, now = new Date()) {
  const [pending, stays] = await Promise.all([undispatchedMessages(now), staysAround(now)]);
  const plan = dispatchPlan(pending, now);
  const hostIds = new Set(
    [...plan.notify, ...plan.remind, ...stays.filter((s) => !s.prepWarnedAt)].map((item) => item.hostId)
  );
  const result = { notified: 0, reminded: 0, prepWarned: 0 };
  if (hostIds.size === 0) return result;

  const t = reservationMessageTable;
  const r = reservationTable;
  const hosts = await db.select().from(usersTable).where(inArray(usersTable.id, [...hostIds]));
  for (const host of hosts) {
    if (!host.email) continue;
    const mine = <M extends { hostId: string }>(list: M[]) => list.filter((m) => m.hostId === host.id);
    const preparations = await listPreparations(host.id);
    const warn = prepWarnings(mine(stays), preparations, now);

    // Se marcan antes de enviar: si QStash repite la llamada, nada se avisa dos veces.
    const [claimedNotify, claimedRemind, claimedWarn] = await db.batch([
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
      db
        .update(r)
        .set({ prepWarnedAt: now })
        .where(and(inArray(r.id, warn.map((s) => s.id)), isNull(r.prepWarnedAt)))
        .returning({ id: r.id }),
    ]);
    const claimed = <M extends { id: string }>(list: M[], rows: { id: string }[]) =>
      list.filter((item) => rows.some((row) => row.id === item.id));
    const notify = claimed(mine(plan.notify), claimedNotify);
    const remind = claimed(mine(plan.remind), claimedRemind);
    const arrivals = claimed(warn, claimedWarn);
    if (notify.length + remind.length + arrivals.length === 0) continue;

    const { subject, text } = digestEmail(
      notify,
      remind,
      origin,
      arrivals.map((s) => ({
        ...s,
        arrival: localInstant(s.checkIn, s.checkInTime),
        preparation: preparations.get(s.id) ?? { done: 0, total: 0, hasChecklist: false },
      }))
    );
    try {
      await sendEmail(host.email, subject, text);
    } catch (error) {
      // Se desmarcan para que el reintento de QStash vuelva a avisar.
      await db.batch([
        db.update(t).set({ notifiedAt: null }).where(inArray(t.id, notify.map((m) => m.id))),
        db.update(t).set({ remindedAt: null }).where(inArray(t.id, remind.map((m) => m.id))),
        db.update(r).set({ prepWarnedAt: null }).where(inArray(r.id, arrivals.map((s) => s.id))),
      ]);
      throw error;
    }
    result.notified += notify.length;
    result.reminded += remind.length;
    result.prepWarned += arrivals.length;
  }
  return result;
}
