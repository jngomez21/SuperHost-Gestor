import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { propertyTable, reservationNoteTable, reservationTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { reservationStatus } from "@/domain/reservation/status";
import { validateNote, validateReservation } from "@/domain/reservation/validate";
import { getProperty, ownedPropertyIds } from "./properties";

const OVERLAP = "23P01";

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code ?? e?.cause?.code;
}

export async function listReservations(hostId: string, now = new Date()) {
  const rows = await db
    .select({ reservation: reservationTable, property: propertyTable })
    .from(reservationTable)
    .innerJoin(propertyTable, eq(reservationTable.propertyId, propertyTable.id))
    .where(eq(propertyTable.hostId, hostId))
    .orderBy(asc(reservationTable.checkIn));

  return rows.map(({ reservation, property }) => ({
    ...reservation,
    property,
    status: reservationStatus(reservation, property, now),
  }));
}

export async function getReservation(hostId: string, id: string, now = new Date()) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ reservation: reservationTable, property: propertyTable })
    .from(reservationTable)
    .innerJoin(propertyTable, eq(reservationTable.propertyId, propertyTable.id))
    .where(and(eq(reservationTable.id, id), eq(propertyTable.hostId, hostId)));
  if (!row) return null;

  const notes = await db
    .select()
    .from(reservationNoteTable)
    .where(eq(reservationNoteTable.reservationId, id))
    .orderBy(desc(reservationNoteTable.createdAt));

  return {
    ...row.reservation,
    property: row.property,
    notes,
    status: reservationStatus(row.reservation, row.property, now),
  };
}

export async function createReservation(hostId: string, raw: Raw) {
  const input = validateReservation(raw);
  if (!input.ok) return input;
  if (!(await getProperty(hostId, input.value.propertyId))) {
    return { ok: false as const, errors: { propertyId: "Elige uno de tus pisos." } };
  }

  try {
    const [row] = await db.insert(reservationTable).values(input.value).returning({ id: reservationTable.id });
    return { ok: true as const, value: row };
  } catch (error) {
    if (pgCode(error) === OVERLAP) {
      return {
        ok: false as const,
        errors: { checkIn: "Ese piso ya tiene una reserva que se cruza con estas fechas." },
      };
    }
    throw error;
  }
}

export async function cancelReservation(hostId: string, id: string) {
  if (!isUuid(id)) return false;
  const rows = await db
    .update(reservationTable)
    .set({ cancelledAt: new Date() })
    .where(
      and(
        eq(reservationTable.id, id),
        isNull(reservationTable.cancelledAt),
        inArray(reservationTable.propertyId, ownedPropertyIds(hostId))
      )
    )
    .returning({ id: reservationTable.id });
  return rows.length > 0;
}

export async function addNote(hostId: string, reservationId: string, raw: Raw) {
  const input = validateNote(raw);
  if (!input.ok) return input;
  if (!(await getReservation(hostId, reservationId))) {
    return { ok: false as const, errors: { form: "Esa reserva no existe." } };
  }
  const [row] = await db
    .insert(reservationNoteTable)
    .values({ reservationId, body: input.value.body })
    .returning({ id: reservationNoteTable.id });
  return { ok: true as const, value: row };
}
