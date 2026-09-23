import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { preparationCheckTable, propertyTaskTable, reservationTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { preparation, validateTaskLabel, type Preparation } from "@/domain/housekeeping/checklist";
import { getProperty, ownedPropertyIds } from "./properties";
import { getReservation } from "./reservations";

const NOT_FOUND = { ok: false as const, errors: { form: "Esa tarea no existe." } };

function ownedTask(hostId: string, taskId: string) {
  return and(eq(propertyTaskTable.id, taskId), inArray(propertyTaskTable.propertyId, ownedPropertyIds(hostId)));
}

export async function listTasks(hostId: string, propertyId: string) {
  if (!(await getProperty(hostId, propertyId))) return [];
  return db
    .select()
    .from(propertyTaskTable)
    .where(eq(propertyTaskTable.propertyId, propertyId))
    .orderBy(asc(propertyTaskTable.position), asc(propertyTaskTable.createdAt));
}

export async function addTask(hostId: string, propertyId: string, raw: Raw) {
  const input = validateTaskLabel(raw);
  if (!input.ok) return input;
  if (!(await getProperty(hostId, propertyId))) return { ok: false as const, errors: { form: "Ese piso no existe." } };
  const [row] = await db
    .insert(propertyTaskTable)
    .values({
      propertyId,
      label: input.value.label,
      position: sql`(select coalesce(max(${propertyTaskTable.position}), 0) + 1 from ${propertyTaskTable} where ${propertyTaskTable.propertyId} = ${propertyId})`,
    })
    .returning({ id: propertyTaskTable.id });
  return { ok: true as const, value: row };
}

export async function renameTask(hostId: string, taskId: string, raw: Raw) {
  const input = validateTaskLabel(raw);
  if (!input.ok) return input;
  if (!isUuid(taskId)) return NOT_FOUND;
  const [row] = await db
    .update(propertyTaskTable)
    .set({ label: input.value.label })
    .where(ownedTask(hostId, taskId))
    .returning({ id: propertyTaskTable.id });
  return row ? { ok: true as const, value: row } : NOT_FOUND;
}

export async function removeTask(hostId: string, taskId: string) {
  if (!isUuid(taskId)) return false;
  const rows = await db.delete(propertyTaskTable).where(ownedTask(hostId, taskId)).returning({ id: propertyTaskTable.id });
  return rows.length > 0;
}

export async function getPreparation(hostId: string, reservationId: string) {
  const reservation = await getReservation(hostId, reservationId);
  if (!reservation) return null;
  const [tasks, checks] = await Promise.all([
    listTasks(hostId, reservation.propertyId),
    db.select().from(preparationCheckTable).where(eq(preparationCheckTable.reservationId, reservationId)),
  ]);
  const doneAt = new Map(checks.map((c) => [c.taskId, c.doneAt]));
  return {
    reservation,
    tasks: tasks.map((task) => ({ ...task, doneAt: doneAt.get(task.id) ?? null })),
    progress: preparation(tasks, doneAt.keys()),
  };
}

export async function setTaskDone(hostId: string, reservationId: string, taskId: string, done: boolean) {
  if (!isUuid(taskId)) return false;
  const reservation = await getReservation(hostId, reservationId);
  if (!reservation) return false;
  const [task] = await db
    .select({ id: propertyTaskTable.id })
    .from(propertyTaskTable)
    .where(and(eq(propertyTaskTable.id, taskId), eq(propertyTaskTable.propertyId, reservation.propertyId)));
  if (!task) return false;

  if (done) {
    await db.insert(preparationCheckTable).values({ reservationId, taskId }).onConflictDoNothing();
  } else {
    await db
      .delete(preparationCheckTable)
      .where(and(eq(preparationCheckTable.reservationId, reservationId), eq(preparationCheckTable.taskId, taskId)));
  }
  return true;
}

export async function listPreparations(hostId: string): Promise<Map<string, Preparation>> {
  const [tasks, checks] = await Promise.all([
    db
      .select({ id: propertyTaskTable.id, propertyId: propertyTaskTable.propertyId })
      .from(propertyTaskTable)
      .where(inArray(propertyTaskTable.propertyId, ownedPropertyIds(hostId))),
    db
      .select({ reservationId: preparationCheckTable.reservationId, taskId: preparationCheckTable.taskId, propertyId: reservationTable.propertyId })
      .from(preparationCheckTable)
      .innerJoin(reservationTable, eq(preparationCheckTable.reservationId, reservationTable.id))
      .where(inArray(reservationTable.propertyId, ownedPropertyIds(hostId))),
  ]);
  const reservations = await db
    .select({ id: reservationTable.id, propertyId: reservationTable.propertyId })
    .from(reservationTable)
    .where(inArray(reservationTable.propertyId, ownedPropertyIds(hostId)));

  return new Map(
    reservations.map((r) => [
      r.id,
      preparation(
        tasks.filter((t) => t.propertyId === r.propertyId),
        checks.filter((c) => c.reservationId === r.id).map((c) => c.taskId)
      ),
    ])
  );
}
