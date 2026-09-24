"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createStandardTemplates, createTemplate, removeTemplate, updateTemplate } from "@/application/messaging";
import { requireHost } from "@/app/_lib/host";

export type TemplateFormState = {
  errors: Record<string, string | undefined>;
  values: Record<string, string>;
} | null;

export async function saveTemplate(
  id: string | null,
  _previous: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const host = await requireHost();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = id ? await updateTemplate(host.id, id, raw) : await createTemplate(host.id, raw);
  if (!result.ok) return { errors: result.errors, values: raw };

  revalidatePath("/mensajes");
  redirect("/mensajes");
}

export async function createStandardTemplatesAction() {
  const host = await requireHost();
  await createStandardTemplates(host.id);
  revalidatePath("/mensajes");
}

export async function removeTemplateAction(id: string) {
  const host = await requireHost();
  await removeTemplate(host.id, id);
  revalidatePath("/mensajes");
  redirect("/mensajes");
}
