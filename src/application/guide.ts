import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/infrastructure/db";
import { deletePhoto, storePhoto } from "@/infrastructure/photos";
import { propertyPhotoTable, propertyPlaceTable, propertyTable } from "@/infrastructure/schema";
import { isUuid, type Raw } from "@/domain/fields";
import { validateGuide, validatePlace } from "@/domain/property/guide";
import { getProperty, ownedPropertyIds } from "./properties";

export const MAX_PHOTOS = 30;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

// La guía de un piso: lo que ven todos sus huéspedes. Sin comprobar dueño: la usan la página
// del huésped (que ya validó su token) y las funciones de abajo (que validan al host).
export async function loadGuide(propertyId: string) {
  const [[property], photos, places] = await Promise.all([
    db.select().from(propertyTable).where(eq(propertyTable.id, propertyId)),
    db
      .select({ id: propertyPhotoTable.id, url: propertyPhotoTable.url })
      .from(propertyPhotoTable)
      .where(eq(propertyPhotoTable.propertyId, propertyId))
      .orderBy(asc(propertyPhotoTable.position), asc(propertyPhotoTable.createdAt)),
    db
      .select()
      .from(propertyPlaceTable)
      .where(eq(propertyPlaceTable.propertyId, propertyId))
      .orderBy(asc(propertyPlaceTable.position), asc(propertyPlaceTable.createdAt)),
  ]);
  return property ? { property, photos, places } : null;
}

export type Guide = NonNullable<Awaited<ReturnType<typeof loadGuide>>>;

export async function getGuide(hostId: string, propertyId: string) {
  return (await getProperty(hostId, propertyId)) ? loadGuide(propertyId) : null;
}

export async function updateGuide(hostId: string, propertyId: string, raw: Raw) {
  const input = validateGuide(raw);
  if (!input.ok) return input;
  if (!isUuid(propertyId)) return { ok: false as const, errors: { form: "Ese piso no existe." } };
  const [row] = await db
    .update(propertyTable)
    .set(input.value)
    .where(and(eq(propertyTable.id, propertyId), eq(propertyTable.hostId, hostId)))
    .returning({ id: propertyTable.id });
  return row ? { ok: true as const, value: row } : { ok: false as const, errors: { form: "Ese piso no existe." } };
}

// ---------- Fotos ----------

export async function addPhoto(hostId: string, propertyId: string, file: unknown) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) return { ok: false as const, error: "Eso no es una foto." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false as const, error: "La foto pesa demasiado (máximo 3 MB)." };
  const guide = await getGuide(hostId, propertyId);
  if (!guide) return { ok: false as const, error: "Ese piso no existe." };
  if (guide.photos.length >= MAX_PHOTOS) return { ok: false as const, error: `Caben ${MAX_PHOTOS} fotos por piso.` };

  const url = await storePhoto(propertyId, file);
  await db.insert(propertyPhotoTable).values({
    propertyId,
    url,
    position: sql`(select coalesce(max(${propertyPhotoTable.position}), 0) + 1 from ${propertyPhotoTable} where ${propertyPhotoTable.propertyId} = ${propertyId})`,
  });
  return { ok: true as const };
}

async function ownedPhoto(hostId: string, photoId: string) {
  if (!isUuid(photoId)) return null;
  const [photo] = await db
    .select()
    .from(propertyPhotoTable)
    .where(and(eq(propertyPhotoTable.id, photoId), inArray(propertyPhotoTable.propertyId, ownedPropertyIds(hostId))));
  return photo ?? null;
}

// "cover" la pone la primera (portada); "up"/"down" la cambian de sitio con la vecina.
export async function movePhoto(hostId: string, photoId: string, move: "cover" | "up" | "down") {
  const photo = await ownedPhoto(hostId, photoId);
  if (!photo) return false;
  const guide = await loadGuide(photo.propertyId);
  const order = guide!.photos.map((p) => p.id);
  const from = order.indexOf(photoId);
  const to = move === "cover" ? 0 : move === "up" ? Math.max(0, from - 1) : Math.min(order.length - 1, from + 1);
  if (from === to) return true;
  order.splice(to, 0, ...order.splice(from, 1));
  // ponytail: una actualización por foto (máximo 30); si crecieran, un solo UPDATE ... FROM (VALUES ...).
  for (const [i, id] of order.entries()) {
    await db.update(propertyPhotoTable).set({ position: i + 1 }).where(eq(propertyPhotoTable.id, id));
  }
  return true;
}

export async function removePhoto(hostId: string, photoId: string) {
  const photo = await ownedPhoto(hostId, photoId);
  if (!photo) return false;
  await db.delete(propertyPhotoTable).where(eq(propertyPhotoTable.id, photoId));
  // Si Blob falla, la foto ya no sale en la guía: queda un archivo huérfano, no un hueco.
  await deletePhoto(photo.url).catch((error) => console.error("No se pudo borrar la foto de Blob", error));
  return true;
}

// ---------- Lugares cercanos ----------

export async function addPlace(hostId: string, propertyId: string, raw: Raw) {
  const input = validatePlace(raw);
  if (!input.ok) return input;
  if (!(await getProperty(hostId, propertyId))) return { ok: false as const, errors: { form: "Ese piso no existe." } };
  await db.insert(propertyPlaceTable).values({
    ...input.value,
    propertyId,
    position: sql`(select coalesce(max(${propertyPlaceTable.position}), 0) + 1 from ${propertyPlaceTable} where ${propertyPlaceTable.propertyId} = ${propertyId})`,
  });
  return { ok: true as const, value: null };
}

export async function removePlace(hostId: string, placeId: string) {
  if (!isUuid(placeId)) return false;
  const rows = await db
    .delete(propertyPlaceTable)
    .where(and(eq(propertyPlaceTable.id, placeId), inArray(propertyPlaceTable.propertyId, ownedPropertyIds(hostId))))
    .returning({ id: propertyPlaceTable.id });
  return rows.length > 0;
}
