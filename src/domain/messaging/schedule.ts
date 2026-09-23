import { addDays, localInstant } from "../reservation/status.ts";
import type { Trigger } from "./template.ts";

type Timing = { trigger: Trigger; dayOffset: number; sendTime: string | null };
type Stay = { checkIn: string; checkOut: string };

export function sendAt(timing: Timing, stay: Stay, registeredAt: Date): Date {
  if (timing.trigger === "booked" || !timing.sendTime) return registeredAt;
  const base = timing.trigger === "check_in" ? stay.checkIn : stay.checkOut;
  return localInstant(addDays(base, timing.dayOffset), timing.sendTime);
}

export type MessageStatus = "sent" | "cancelled" | "due" | "scheduled";

type Message = { sendAt: Date; sentAt: Date | null; cancelledAt: Date | null; reservationCancelled: boolean };

// Lo enviado se queda enviado aunque luego se cancele la reserva: es historial.
export function messageStatus(message: Message, now: Date): MessageStatus {
  if (message.sentAt) return "sent";
  if (message.cancelledAt || message.reservationCancelled) return "cancelled";
  return message.sendAt <= now ? "due" : "scheduled";
}

export const REMIND_AFTER_HOURS = 3;

type Pending = Message & { notifiedAt: Date | null; remindedAt: Date | null };

// Qué avisar al host en esta pasada: lo que acaba de tocar y, una sola vez,
// lo que sigue sin enviar REMIND_AFTER_HOURS después del primer aviso.
export function dispatchPlan<M extends Pending>(messages: M[], now: Date): { notify: M[]; remind: M[] } {
  const due = messages.filter((m) => messageStatus(m, now) === "due");
  const remindBefore = now.getTime() - REMIND_AFTER_HOURS * 3_600_000;
  return {
    notify: due.filter((m) => !m.notifiedAt),
    remind: due.filter((m) => m.notifiedAt && !m.remindedAt && m.notifiedAt.getTime() <= remindBefore),
  };
}
