import { text, type Raw, type Result } from "../fields.ts";
import { localInstant } from "../reservation/status.ts";

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

export function pendingArrivals<R extends { id: string; status: string }>(
  arrivals: R[],
  preparations: Map<string, Preparation>
): R[] {
  return arrivals.filter((r) => r.status === "upcoming" && !preparations.get(r.id)?.ready);
}

// ¿Estaba el piso listo a la hora de llegada? Cuenta la lista que había entonces: cada tarea
// creada antes de la llegada tenía que estar marcada antes de ella. Sin lista, no estaba listo.
export function readyAt(tasks: { id: string; createdAt: Date }[], checks: { taskId: string; doneAt: Date }[], arrival: Date) {
  const listThen = tasks.filter((t) => t.createdAt <= arrival);
  const doneThen = new Set(checks.filter((c) => c.doneAt <= arrival).map((c) => c.taskId));
  return listThen.length > 0 && listThen.every((t) => doneThen.has(t.id));
}

type Stay = {
  id: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  checkInTime: string;
  checkOutTime: string;
  cancelledAt: Date | null;
  prepWarnedAt: Date | null;
};

const DAY = 24 * 3_600_000;

// Llegadas de las que avisar al host porque el piso sigue sin preparar. El aviso toca cuando
// ya se puede preparar: 24 h antes de la llegada o, si el huésped anterior sale más tarde,
// a la hora de su salida. Una sola vez, y nunca después de la llegada.
export function prepWarnings<S extends Stay>(stays: S[], preparations: Map<string, Preparation>, now: Date): S[] {
  const active = stays.filter((s) => !s.cancelledAt);
  return active.filter((s) => {
    if (s.prepWarnedAt || preparations.get(s.id)?.ready) return false;
    const arrival = localInstant(s.checkIn, s.checkInTime).getTime();
    const previousOut = Math.max(
      ...active
        .filter((p) => p.propertyId === s.propertyId && p.id !== s.id && p.checkOut <= s.checkIn)
        .map((p) => localInstant(p.checkOut, p.checkOutTime).getTime())
    );
    return now.getTime() >= Math.max(arrival - DAY, previousOut) && now.getTime() < arrival;
  });
}

export function validateTaskLabel(raw: Raw): Result<{ label: string }> {
  const label = text(raw, "label");
  if (!label) return { ok: false, errors: { label: "Escribe la tarea." } };
  if (label.length > 80) return { ok: false, errors: { label: "La tarea no puede pasar de 80 caracteres." } };
  return { ok: true, value: { label } };
}
