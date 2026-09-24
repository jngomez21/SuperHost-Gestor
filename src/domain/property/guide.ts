import { optionalText, text, type Raw, type Result } from "../fields.ts";

export type Location = { lat: number; lng: number };

const NUMBER = String.raw`(-?\d{1,3}(?:\.\d+)?)`;
// "7.0727, -73.1112", o un enlace de Google Maps: ".../@7.0727,-73.1112,17z", "?q=7.07,-73.11",
// "?query=…", "&ll=…" o "!3d7.07!4d-73.11" (el pin exacto, que manda sobre el centro del mapa).
const PATTERNS = [
  new RegExp(String.raw`!3d${NUMBER}!4d${NUMBER}`),
  new RegExp(String.raw`[?&](?:q|query|ll|destination)=${NUMBER},\s*${NUMBER}`),
  new RegExp(String.raw`@${NUMBER},${NUMBER}`),
  new RegExp(String.raw`^\s*${NUMBER}\s*,\s*${NUMBER}\s*$`),
];

export function parseLocation(input: string): Location | null {
  const value = decodeURIComponent(input.trim());
  for (const pattern of PATTERNS) {
    const match = value.match(pattern);
    if (!match) continue;
    const [lat, lng] = [Number(match[1]), Number(match[2])];
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
  }
  return null;
}

export function formatLocation(location: Location | null): string {
  return location ? `${location.lat}, ${location.lng}` : "";
}

// Listas escritas una por línea ("- toallas", "• secador" o sin viñeta).
export function lines(value: string | null): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export const googleMapsUrl = ({ lat, lng }: Location) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

export function directionsUrl(destination: string, origin: Location | null) {
  const from = origin ? `&origin=${origin.lat},${origin.lng}` : "";
  return `https://www.google.com/maps/dir/?api=1${from}&destination=${encodeURIComponent(destination)}`;
}

export function mapEmbedUrl({ lat, lng }: Location) {
  const d = 0.0035;
  const bbox = [lng - d, lat - d, lng + d, lat + d].map((n) => n.toFixed(5)).join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
}

// Campos de texto de la guía, en el orden en que los ve el huésped.
export const GUIDE_TEXTS = [
  "wifiName",
  "wifiPassword",
  "tvInfo",
  "arrivalInfo",
  "accessInstructions",
  "houseRules",
  "houseGuide",
  "amenities",
  "trashInfo",
  "checkoutList",
  "transportInfo",
  "emergencyInfo",
] as const;

export type GuideText = (typeof GUIDE_TEXTS)[number];
export type GuideInput = Record<GuideText, string | null> & { latitude: number | null; longitude: number | null };

const MAX_TEXT = 2000;

export function validateGuide(raw: Raw): Result<GuideInput> {
  const errors: Partial<Record<keyof GuideInput | "location", string>> = {};
  const texts = Object.fromEntries(GUIDE_TEXTS.map((field) => [field, optionalText(raw, field)])) as Record<GuideText, string | null>;
  for (const field of GUIDE_TEXTS) {
    if ((texts[field]?.length ?? 0) > MAX_TEXT) errors[field] = `No puede pasar de ${MAX_TEXT} caracteres.`;
  }

  const where = text(raw, "location");
  const location = where ? parseLocation(where) : null;
  if (where && !location) {
    errors.location = "No encuentro la ubicación: pega un enlace de Google Maps o escribe latitud y longitud, como 7.0727, -73.1112.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { ...texts, latitude: location?.lat ?? null, longitude: location?.lng ?? null } };
}

export const PLACE_CATEGORIES = [
  "Salud",
  "Supermercado",
  "Farmacia",
  "Compras",
  "Comida",
  "Transporte",
  "Parque",
  "Turismo",
  "Otro",
] as const;

export type PlaceInput = { name: string; category: string; distance: string | null; note: string | null; mapsQuery: string | null };

export function validatePlace(raw: Raw): Result<PlaceInput> {
  const value: PlaceInput = {
    name: text(raw, "name"),
    category: text(raw, "category"),
    distance: optionalText(raw, "distance"),
    note: optionalText(raw, "note"),
    mapsQuery: optionalText(raw, "mapsQuery"),
  };
  const errors: Partial<Record<keyof PlaceInput, string>> = {};
  if (!value.name) errors.name = "Escribe el nombre del lugar.";
  else if (value.name.length > 80) errors.name = "El nombre no puede pasar de 80 caracteres.";
  if (!(PLACE_CATEGORIES as readonly string[]).includes(value.category)) errors.category = "Elige un tipo de lugar.";
  if ((value.distance?.length ?? 0) > 40) errors.distance = "La distancia no puede pasar de 40 caracteres.";
  if ((value.note?.length ?? 0) > 200) errors.note = "La nota no puede pasar de 200 caracteres.";
  if ((value.mapsQuery?.length ?? 0) > 200) errors.mapsQuery = "No puede pasar de 200 caracteres.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
