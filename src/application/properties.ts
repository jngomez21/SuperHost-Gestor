import { and, asc, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { propertyTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { validateProperty } from "@/domain/property/validate";

export function listProperties(hostId: string) {
  return db.select().from(propertyTable).where(eq(propertyTable.hostId, hostId)).orderBy(asc(propertyTable.name));
}

export async function getProperty(hostId: string, id: string) {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select()
    .from(propertyTable)
    .where(and(eq(propertyTable.id, id), eq(propertyTable.hostId, hostId)));
  return row ?? null;
}

export async function createProperty(hostId: string, raw: Raw) {
  const input = validateProperty(raw);
  if (!input.ok) return input;
  const [row] = await db
    .insert(propertyTable)
    .values({ ...input.value, hostId })
    .returning({ id: propertyTable.id });
  return { ok: true as const, value: row };
}

export async function updateProperty(hostId: string, id: string, raw: Raw) {
  const input = validateProperty(raw);
  if (!input.ok) return input;
  if (!isUuid(id)) return { ok: false as const, errors: { form: "Ese piso no existe." } };
  const [row] = await db
    .update(propertyTable)
    .set(input.value)
    .where(and(eq(propertyTable.id, id), eq(propertyTable.hostId, hostId)))
    .returning({ id: propertyTable.id });
  return row
    ? { ok: true as const, value: row }
    : { ok: false as const, errors: { form: "Ese piso no existe." } };
}
