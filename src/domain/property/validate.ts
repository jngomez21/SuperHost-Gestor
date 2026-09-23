import { isTime, optionalText, text, type Raw, type Result } from "../fields.ts";

export type PropertyInput = {
  name: string;
  address: string;
  wifiName: string | null;
  wifiPassword: string | null;
  accessInstructions: string | null;
  checkInTime: string;
  checkOutTime: string;
};

export function validateProperty(raw: Raw): Result<PropertyInput> {
  const value: PropertyInput = {
    name: text(raw, "name"),
    address: text(raw, "address"),
    wifiName: optionalText(raw, "wifiName"),
    wifiPassword: optionalText(raw, "wifiPassword"),
    accessInstructions: optionalText(raw, "accessInstructions"),
    checkInTime: text(raw, "checkInTime") || "15:00",
    checkOutTime: text(raw, "checkOutTime") || "11:00",
  };

  const errors: Partial<Record<keyof PropertyInput, string>> = {};
  if (!value.name) errors.name = "Ponle un nombre al piso.";
  else if (value.name.length > 80) errors.name = "El nombre no puede pasar de 80 caracteres.";
  if (!value.address) errors.address = "Escribe la dirección.";
  if (!isTime(value.checkInTime)) errors.checkInTime = "Usa el formato de hora 15:00.";
  if (!isTime(value.checkOutTime)) errors.checkOutTime = "Usa el formato de hora 11:00.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
