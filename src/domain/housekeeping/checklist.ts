import { text, type Raw, type Result } from "../fields.ts";

export const STANDARD_TASKS = [
  "Cambiar sábanas",
  "Toallas limpias",
  "Limpiar baño",
  "Limpiar cocina y nevera",
  "Sacar la basura",
  "Reponer papel, jabón y café",
  "Revisar que el wifi funciona",
  "Dejar la llave lista",
] as const;

export type Preparation = { done: number; total: number; ready: boolean; hasChecklist: boolean };

export function preparation(tasks: { id: string }[], checkedTaskIds: Iterable<string>): Preparation {
  const checked = new Set(checkedTaskIds);
  const done = tasks.filter((task) => checked.has(task.id)).length;
  const total = tasks.length;
  return { done, total, ready: total > 0 && done === total, hasChecklist: total > 0 };
}

export function validateTaskLabel(raw: Raw): Result<{ label: string }> {
  const label = text(raw, "label");
  if (!label) return { ok: false, errors: { label: "Escribe la tarea." } };
  if (label.length > 80) return { ok: false, errors: { label: "La tarea no puede pasar de 80 caracteres." } };
  return { ok: true, value: { label } };
}
