"use server";

import { revalidatePath } from "next/cache";
import { addPhoto, addPlace, movePhoto, removePhoto, removePlace, updateGuide } from "@/application/guide";
import { requireHost } from "@/app/_lib/host";

export type GuideFormState = {
  errors: Record<string, string | undefined>;
  values: Record<string, string>;
  saved?: boolean;
} | null;

export async function saveGuideAction(propertyId: string, _previous: GuideFormState, formData: FormData): Promise<GuideFormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = await updateGuide(host.id, propertyId, raw);
  if (!result.ok) return { errors: result.errors, values: raw };
  revalidatePath(`/guia/${propertyId}`);
  return { errors: {}, values: raw, saved: true };
}

// Una foto por llamada: el navegador ya la comprimió (ADR-008).
export async function addPhotoAction(propertyId: string, formData: FormData): Promise<string | null> {
  const host = await requireHost();
  const result = await addPhoto(host.id, propertyId, formData.get("photo"));
  if (!result.ok) return result.error;
  revalidatePath(`/guia/${propertyId}`);
  return null;
}

export async function movePhotoAction(propertyId: string, photoId: string, move: "cover" | "up" | "down") {
  const host = await requireHost();
  await movePhoto(host.id, photoId, move);
  revalidatePath(`/guia/${propertyId}`);
}

export async function removePhotoAction(propertyId: string, photoId: string) {
  const host = await requireHost();
  await removePhoto(host.id, photoId);
  revalidatePath(`/guia/${propertyId}`);
}

export async function addPlaceAction(propertyId: string, _previous: GuideFormState, formData: FormData): Promise<GuideFormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = await addPlace(host.id, propertyId, raw);
  if (!result.ok) return { errors: result.errors, values: raw };
  revalidatePath(`/guia/${propertyId}`);
  return null;
}

export async function removePlaceAction(propertyId: string, placeId: string) {
  const host = await requireHost();
  await removePlace(host.id, placeId);
  revalidatePath(`/guia/${propertyId}`);
}
