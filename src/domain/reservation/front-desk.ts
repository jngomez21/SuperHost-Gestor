import { reservationStatus, todayInColombia, addDays } from "./status.ts";

type Schedule = { checkInTime: string; checkOutTime: string };
type PropertyLike = Schedule & { id: string };
type ReservationLike = { propertyId: string; checkIn: string; checkOut: string; cancelledAt: Date | null };

export type Movement<R> = { kind: "departure" | "arrival"; reservation: R };

export function frontDesk<P extends PropertyLike, R extends ReservationLike>(
  properties: P[],
  reservations: R[],
  now: Date,
  days = 7
) {
  const today = todayInColombia(now);
  const active = reservations.filter((r) => !r.cancelledAt);
  const scheduleOf = new Map(properties.map((p) => [p.id, p]));
  const statusOf = (r: R) => reservationStatus(r, scheduleOf.get(r.propertyId)!, now);

  const rack = properties.map((property) => {
    const own = active.filter((r) => r.propertyId === property.id);
    return {
      property,
      inHouse: own.find((r) => statusOf(r) === "in_house") ?? null,
      arrivingToday: own.find((r) => r.checkIn === today && statusOf(r) === "upcoming") ?? null,
      leftToday: own.find((r) => r.checkOut === today && statusOf(r) === "finished") ?? null,
      next: own
        .filter((r) => r.checkIn > today)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0] ?? null,
    };
  });

  const agenda = Array.from({ length: days }, (_, i) => {
    const date = addDays(today, i);
    const movements: Movement<R>[] = [
      ...active.filter((r) => r.checkOut === date).map((reservation) => ({ kind: "departure" as const, reservation })),
      ...active.filter((r) => r.checkIn === date).map((reservation) => ({ kind: "arrival" as const, reservation })),
    ];
    return { date, movements };
  }).filter((day) => day.movements.length > 0);

  return { today, rack, agenda };
}
