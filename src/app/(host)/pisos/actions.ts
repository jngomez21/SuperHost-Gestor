"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProperty, updateProperty } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";

export type PropertyFormState = {
  errors: Record<string, string | undefined>;
  values: Record<string, string>;
} | null;

export async function saveProperty(
  id: string | null,
  _previous: PropertyFormState,
  formData: FormData
): Promise<PropertyFormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = id ? await updateProperty(host.id, id, raw) : await createProperty(host.id, raw);
  if (!result.ok) return { errors: result.errors, values: raw };

  revalidatePath("/pisos");
  redirect("/pisos");
}
