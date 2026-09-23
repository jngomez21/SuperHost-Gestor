import { isDate, isEmail, isUuid, optionalText, text, type Raw, type Result } from "../fields.ts";

export type ReservationInput = {
  propertyId: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  guestCount: number;
  checkIn: string;
  checkOut: string;
};

export function validateReservation(raw: Raw): Result<ReservationInput> {
  const count = text(raw, "guestCount");
  const value: ReservationInput = {
    propertyId: text(raw, "propertyId"),
    guestName: text(raw, "guestName"),
    guestEmail: optionalText(raw, "guestEmail")?.toLowerCase() ?? null,
    guestPhone: optionalText(raw, "guestPhone"),
    guestCount: count ? Number(count) : 1,
    checkIn: text(raw, "checkIn"),
    checkOut: text(raw, "checkOut"),
  };

  const errors: Partial<Record<keyof ReservationInput, string>> = {};
  if (!isUuid(value.propertyId)) errors.propertyId = "Elige el piso.";
  if (!value.guestName) errors.guestName = "Escribe el nombre del huésped.";
  if (value.guestEmail && !isEmail(value.guestEmail)) errors.guestEmail = "Escribe un email válido, como nombre@correo.com.";
  if (!Number.isInteger(value.guestCount) || value.guestCount < 1 || value.guestCount > 50) {
    errors.guestCount = "Pon un número de huéspedes entre 1 y 50.";
  }
  if (!isDate(value.checkIn)) errors.checkIn = "Elige la fecha de llegada.";
  if (!isDate(value.checkOut)) errors.checkOut = "Elige la fecha de salida.";
  else if (isDate(value.checkIn) && value.checkOut <= value.checkIn) {
    errors.checkOut = "La salida tiene que ser después de la llegada.";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function validateNote(raw: Raw): Result<{ body: string }> {
  const body = text(raw, "body");
  if (!body) return { ok: false, errors: { body: "Escribe la nota antes de guardarla." } };
  if (body.length > 2000) return { ok: false, errors: { body: "La nota no puede pasar de 2000 caracteres." } };
  return { ok: true, value: { body } };
}
