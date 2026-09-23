export type ReservationStatus = "cancelled" | "finished" | "in_house" | "upcoming";

type Stay = { checkIn: string; checkOut: string; cancelledAt: Date | null };
type Schedule = { checkInTime: string; checkOutTime: string };

// ponytail: offset fijo de Colombia, que no tiene horario de verano. Si hay pisos en
// otra zona, guardar la zona en el piso y convertir con Intl/Temporal.
const COLOMBIA_OFFSET = "-05:00";

export function localInstant(date: string, time: string): Date {
  return new Date(`${date}T${time.slice(0, 5)}:00${COLOMBIA_OFFSET}`);
}

export function todayInColombia(now: Date): string {
  return new Date(now.getTime() - 5 * 3_600_000).toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nights(checkIn: string, checkOut: string): number {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);
}

export function reservationStatus(stay: Stay, schedule: Schedule, now: Date): ReservationStatus {
  if (stay.cancelledAt) return "cancelled";
  if (now >= localInstant(stay.checkOut, schedule.checkOutTime)) return "finished";
  if (now >= localInstant(stay.checkIn, schedule.checkInTime)) return "in_house";
  return "upcoming";
}
