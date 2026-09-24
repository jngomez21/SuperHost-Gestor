import { and, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import {
  preparationCheckTable,
  propertyTable,
  propertyTaskTable,
  reservationMessageTable,
  reservationTable,
} from "@/infrastructure/schema";
import { readyAt } from "@/domain/housekeeping/checklist";
import { responseTime } from "@/domain/messaging/schedule";
import { localInstant, todayInColombia } from "@/domain/reservation/status";
import { ownedPropertyIds } from "./properties";

export const METRICS_DAYS = 30;

// Primeras métricas del host en los últimos 30 días: cuánto tarda en mandar los mensajes
// y cuántas llegadas encontraron el piso sin terminar.
export async function hostMetrics(hostId: string, now = new Date()) {
  const since = new Date(now.getTime() - METRICS_DAYS * 86_400_000);
  const r = reservationTable;
  const [sent, stays, tasks, checks] = await Promise.all([
    db
      .select({ sendAt: reservationMessageTable.sendAt, sentAt: reservationMessageTable.sentAt })
      .from(reservationMessageTable)
      .innerJoin(r, eq(reservationMessageTable.reservationId, r.id))
      .where(and(inArray(r.propertyId, ownedPropertyIds(hostId)), gte(reservationMessageTable.sentAt, since))),
    db
      .select({ id: r.id, propertyId: r.propertyId, checkIn: r.checkIn, checkInTime: propertyTable.checkInTime })
      .from(r)
      .innerJoin(propertyTable, eq(r.propertyId, propertyTable.id))
      .where(
        and(
          eq(propertyTable.hostId, hostId),
          isNull(r.cancelledAt),
          gte(r.checkIn, todayInColombia(since)),
          lte(r.checkIn, todayInColombia(now))
        )
      ),
    db
      .select({ id: propertyTaskTable.id, propertyId: propertyTaskTable.propertyId, createdAt: propertyTaskTable.createdAt })
      .from(propertyTaskTable)
      .where(inArray(propertyTaskTable.propertyId, ownedPropertyIds(hostId))),
    db
      .select({ reservationId: preparationCheckTable.reservationId, taskId: preparationCheckTable.taskId, doneAt: preparationCheckTable.doneAt })
      .from(preparationCheckTable)
      .innerJoin(r, eq(preparationCheckTable.reservationId, r.id))
      .where(and(inArray(r.propertyId, ownedPropertyIds(hostId)), gte(r.checkIn, todayInColombia(since)))),
  ]);

  const arrived = stays
    .map((s) => ({ ...s, arrival: localInstant(s.checkIn, s.checkInTime) }))
    .filter((s) => s.arrival >= since && s.arrival <= now);
  const unready = arrived.filter(
    (s) =>
      !readyAt(
        tasks.filter((t) => t.propertyId === s.propertyId),
        checks.filter((c) => c.reservationId === s.id),
        s.arrival
      )
  );

  return {
    response: responseTime(sent.map((m) => ({ sendAt: m.sendAt, sentAt: m.sentAt! }))),
    arrivals: arrived.length,
    unready: unready.length,
  };
}
