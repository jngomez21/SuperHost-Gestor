import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { propertyTable, reservationMessageTable, reservationNoteTable, reservationTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { firstName, guestView } from "@/domain/reservation/guest";
import { reservationStatus } from "@/domain/reservation/status";
import { validateNote, validateReservation } from "@/domain/reservation/validate";
import { loadGuide } from "./guide";
import { messagesToSchedule } from "./messaging";
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

export async function createReservation(hostId: string, raw: Raw, now = new Date()) {
  const input = validateReservation(raw);
  if (!input.ok) return input;
  const property = await getProperty(hostId, input.value.propertyId);
  if (!property) {
    return { ok: false as const, errors: { propertyId: "Elige uno de tus pisos." } };
  }

  const id = crypto.randomUUID();
  const started = reservationStatus({ ...input.value, cancelledAt: null }, property, now) !== "upcoming";
  const messages = await messagesToSchedule(hostId, { ...input.value, id }, started, now);
  const insertReservation = db.insert(reservationTable).values({ ...input.value, id });

  try {
    if (messages.length > 0) {
      await db.batch([insertReservation, db.insert(reservationMessageTable).values(messages)]);
    } else {
      await insertReservation;
    }
    return { ok: true as const, value: { id } };
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

// Lo que ve el huésped con su enlace: su estancia y la guía del piso. Nunca notas, contacto
// ni otras reservas. Tras la salida, solo su nombre y la portada para el agradecimiento.
export async function getGuestStay(token: string, now = new Date()) {
  if (!isUuid(token)) return null;
  const r = reservationTable;
  const p = propertyTable;
  const [row] = await db
    .select({
      propertyId: r.propertyId,
      guestName: r.guestName,
      guestCount: r.guestCount,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      cancelledAt: r.cancelledAt,
      checkInTime: p.checkInTime,
      checkOutTime: p.checkOutTime,
    })
    .from(r)
    .innerJoin(p, eq(r.propertyId, p.id))
    .where(eq(r.guestToken, token));
  if (!row) return null;

  const view = guestView(row, row, now);
  if (!view) return null;
  const guide = (await loadGuide(row.propertyId))!;
  const stay = { firstName: firstName(row.guestName), guestCount: row.guestCount, checkIn: row.checkIn, checkOut: row.checkOut };
  if (view === "thanks") {
    return { view, firstName: stay.firstName, propertyName: guide.property.name, coverUrl: guide.photos[0]?.url ?? null };
  }
  return { view, stay, guide };
}

// Un token nuevo para la reserva: el enlace anterior deja de funcionar al instante (ADR-007).
export async function regenerateGuestToken(hostId: string, id: string) {
  if (!isUuid(id)) return false;
  const rows = await db
    .update(reservationTable)
    .set({ guestToken: sql`default` })
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
