import { reservationStatus } from "./status.ts";

export type GuestView = "stay" | "thanks";

type Stay = { guestName: string; checkIn: string; checkOut: string; cancelledAt: Date | null };
type Schedule = { checkInTime: string; checkOutTime: string };

// Qué ve el huésped con su enlace (ADR-007): su estancia hasta la hora de salida y, desde
// entonces, solo el agradecimiento. Una reserva cancelada no tiene nada que mostrar.
export function guestView(stay: Stay, schedule: Schedule, now: Date): GuestView | null {
  const status = reservationStatus(stay, schedule, now);
  if (status === "cancelled") return null;
  return status === "finished" ? "thanks" : "stay";
}

export function firstName(guestName: string): string {
  return guestName.trim().split(/\s+/)[0];
}
