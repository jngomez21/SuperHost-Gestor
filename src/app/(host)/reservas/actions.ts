"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addNote, cancelReservation, createReservation } from "@/application/reservations";
import { requireHost } from "@/app/_lib/host";

export type FormState = {
  errors: Record<string, string | undefined>;
  values: Record<string, string>;
} | null;

export async function createReservationAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = await createReservation(host.id, raw);
  if (!result.ok) return { errors: result.errors, values: raw };

  revalidatePath("/reservas");
  redirect(`/reservas/${result.value.id}`);
}

export async function addNoteAction(reservationId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = await addNote(host.id, reservationId, raw);
  if (!result.ok) return { errors: result.errors, values: raw };

  revalidatePath(`/reservas/${reservationId}`);
  return null;
}

export async function cancelReservationAction(reservationId: string) {
  const host = await requireHost();
  await cancelReservation(host.id, reservationId);
  revalidatePath(`/reservas/${reservationId}`);
  revalidatePath("/reservas");
}
