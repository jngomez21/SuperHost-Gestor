export type Raw = Record<string, unknown>;

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; errors: Partial<Record<keyof T | "form", string>> };

export function text(raw: Raw, name: string): string {
  const value = raw[name];
  return typeof value === "string" ? value.trim() : "";
}

export function optionalText(raw: Raw, name: string): string | null {
  return text(raw, name) || null;
}

export function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
