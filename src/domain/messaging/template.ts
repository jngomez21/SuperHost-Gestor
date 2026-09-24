import { isTime, text, type Raw, type Result } from "../fields.ts";

export type Trigger = "booked" | "check_in" | "check_out";

const TRIGGERS: readonly string[] = ["booked", "check_in", "check_out"];

// Clave: lo que escribe el host entre llaves. Valor: cómo se nombra el dato si falta.
export const VARIABLES = {
  nombre: "nombre del huésped",
  piso: "nombre del piso",
  direccion: "dirección",
  llegada: "día de llegada",
  hora_llegada: "hora de llegada",
  salida: "día de salida",
  hora_salida: "hora de salida",
  wifi: "nombre del wifi",
  clave_wifi: "clave del wifi",
  como_entrar: "cómo entrar",
} as const;

export type Variable = keyof typeof VARIABLES;
export type Values = Record<Variable, string | null>;

const PLACEHOLDER = /\{([^{}]+)\}/g;

function isVariable(name: string): name is Variable {
  return Object.hasOwn(VARIABLES, name);
}

// El texto se pega en el chat de Airbnb: fechas largas y espacios normales.
const longDate = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const clock = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const plain = (value: string) => value.replace(/\s/g, " ");
const day = (isoDate: string) => plain(longDate.format(new Date(`${isoDate}T00:00:00Z`))).replace(",", "");
const hour = (hhmm: string) => plain(clock.format(new Date(`2000-01-01T${hhmm.slice(0, 5)}:00Z`)));

type Stay = { guestName: string; checkIn: string; checkOut: string };
type Place = {
  name: string;
  address: string;
  wifiName: string | null;
  wifiPassword: string | null;
  accessInstructions: string | null;
  checkInTime: string;
  checkOutTime: string;
};

export function messageValues(stay: Stay, place: Place): Values {
  return {
    nombre: stay.guestName.trim().split(/\s+/)[0],
    piso: place.name,
    direccion: place.address,
    llegada: day(stay.checkIn),
    hora_llegada: hour(place.checkInTime),
    salida: day(stay.checkOut),
    hora_salida: hour(place.checkOutTime),
    wifi: place.wifiName,
    clave_wifi: place.wifiPassword,
    como_entrar: place.accessInstructions,
  };
}

export function render(body: string, values: Values): { text: string; missing: Variable[] } {
  const missing = new Set<Variable>();
  const text = body.replace(PLACEHOLDER, (match, name: string, offset: number) => {
    if (!isVariable(name)) return match;
    const value = values[name]?.trim();
    // "desde las {hora_llegada}." con "3:00 p. m." no debe quedar en "p. m..".
    if (value && value.endsWith(".") && body[offset + match.length] === ".") return value.slice(0, -1);
    if (value) return value;
    missing.add(name);
    return `[falta: ${VARIABLES[name]}]`;
  });
  return { text, missing: [...missing] };
}

function bodyError(body: string): string | undefined {
  if (!body) return "Escribe el mensaje.";
  if (body.length > 2000) return "El mensaje no puede pasar de 2000 caracteres.";
}

// Texto final de un mensaje concreto: se envía tal cual, sin variables.
export function validateMessage(raw: Raw): Result<{ body: string }> {
  const body = text(raw, "body");
  const error = bodyError(body);
  return error ? { ok: false, errors: { body: error } } : { ok: true, value: { body } };
}

export type TemplateInput = {
  name: string;
  body: string;
  trigger: Trigger;
  dayOffset: number;
  sendTime: string | null;
};

export function validateTemplate(raw: Raw): Result<TemplateInput> {
  const trigger = text(raw, "trigger");
  const booked = trigger === "booked";
  const value: TemplateInput = {
    name: text(raw, "name"),
    body: text(raw, "body"),
    trigger: trigger as Trigger,
    dayOffset: booked ? 0 : Number(text(raw, "dayOffset") || 0),
    sendTime: booked ? null : text(raw, "sendTime"),
  };

  const errors: Partial<Record<keyof TemplateInput, string>> = {};
  if (!value.name) errors.name = "Ponle un nombre a la plantilla.";
  else if (value.name.length > 60) errors.name = "El nombre no puede pasar de 60 caracteres.";

  const unknown = new Set([...value.body.matchAll(PLACEHOLDER)].map((m) => m[1]).filter((n) => !isVariable(n)));
  const bodyProblem = bodyError(value.body);
  if (bodyProblem) errors.body = bodyProblem;
  else if (unknown.size) {
    const names = [...unknown].map((n) => `{${n}}`).join(", ");
    errors.body = `No conozco ${names}. Usa las variables de la lista, en minúsculas.`;
  }

  if (!TRIGGERS.includes(trigger)) errors.trigger = "Elige cuándo se envía.";
  else if (!booked) {
    if (!Number.isInteger(value.dayOffset) || value.dayOffset < -30 || value.dayOffset > 30) {
      errors.dayOffset = "Elige entre 30 días antes y 30 días después.";
    }
    if (!isTime(value.sendTime ?? "")) errors.sendTime = "Elige la hora de envío.";
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

export function timingLabel(trigger: Trigger, dayOffset: number): string {
  if (trigger === "booked") return "Al registrar la reserva";
  const event = trigger === "check_in" ? "la llegada" : "la salida";
  if (dayOffset === 0) return `El día de ${event}`;
  if (dayOffset === -1) return `El día antes de ${event}`;
  if (dayOffset === 1) return `El día después de ${event}`;
  return dayOffset < 0 ? `${-dayOffset} días antes de ${event}` : `${dayOffset} días después de ${event}`;
}

export const STANDARD_TEMPLATES: TemplateInput[] = [
  {
    name: "Bienvenida",
    trigger: "booked",
    dayOffset: 0,
    sendTime: null,
    body: `¡Hola {nombre}! Gracias por reservar {piso}. Te espero el {llegada}; puedes entrar desde las {hora_llegada}.

El día antes te mandaré por aquí la dirección y cómo entrar. Si mientras tanto necesitas algo, escríbeme.`,
  },
  {
    name: "Instrucciones de llegada",
    trigger: "check_in",
    dayOffset: -1,
    sendTime: "10:00",
    body: `Hola {nombre}, ¡mañana llegas a {piso}!

Dirección: {direccion}
Puedes entrar desde las {hora_llegada}.
Cómo entrar: {como_entrar}

Wifi: {wifi}
Clave: {clave_wifi}

Si algo no funciona al llegar, escríbeme por aquí y te ayudo enseguida.`,
  },
  {
    name: "Recordatorio de salida",
    trigger: "check_out",
    dayOffset: -1,
    sendTime: "19:00",
    body: `Hola {nombre}, espero que estés disfrutando {piso}. Te recuerdo que mañana la salida es antes de las {hora_salida}.

Antes de irte, deja las llaves como las encontraste. Si necesitas salir más tarde, dímelo hoy y miro si es posible.`,
  },
  {
    name: "Despedida",
    trigger: "check_out",
    dayOffset: 0,
    sendTime: "14:00",
    body: `Gracias por quedarte en {piso}, {nombre}. Espero que todo haya ido bien.

Si te gustó, una reseña me ayuda muchísimo: como anfitrión nuevo, cada una cuenta. ¡Vuelve cuando quieras!`,
  },
];
