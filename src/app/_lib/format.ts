import type { ReservationStatus } from "@/domain/reservation/status";

const timeFormat = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" });
const dateFormat = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const dateTimeFormat = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export function formatTime(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return hhmm;
  return timeFormat.format(new Date(2000, 0, 1, hours, minutes));
}

export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? isoDate : dateFormat.format(date);
}

const longDateFormat = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function formatLongDate(isoDate: string): string {
  const text = longDateFormat.format(new Date(`${isoDate}T00:00:00Z`)).replace(",", "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function dayLabel(isoDate: string, today: string): string {
  if (isoDate === today) return "Hoy";
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (isoDate === tomorrow.toISOString().slice(0, 10)) return "Mañana";
  const text = formatDate(isoDate);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  upcoming: "Próxima",
  in_house: "Huésped en casa",
  finished: "Terminada",
  cancelled: "Cancelada",
};
