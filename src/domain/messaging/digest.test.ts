import { test } from "node:test";
import assert from "node:assert/strict";
import { digestEmail } from "./digest.ts";
import type { Variable } from "./template.ts";

const message = {
  id: "m1",
  name: "Bienvenida",
  sendAt: new Date("2026-09-24T14:07:00Z"),
  text: "¡Hola Laura!",
  missing: [] as Variable[],
  reservation: { id: "r1", guestName: "Laura Restrepo" },
  property: { name: "Loft Chapinero" },
};

test("resumen: un mensaje lleva su nombre y huésped en el asunto, el texto tal cual y el enlace", () => {
  const { subject, text } = digestEmail([message], [], "https://gestor.test");
  assert.equal(subject, "Por enviar: Bienvenida para Laura Restrepo");
  assert.match(text, /Toca desde el jueves, 24 de septiembre, 9:07/);
  assert.match(text, /\n¡Hola Laura!\n/);
  assert.match(text, /https:\/\/gestor\.test\/reservas\/r1#mensaje-m1/);
});

test("resumen: varios mensajes van juntos, los pendientes marcados como recordatorio y con lo que falta", () => {
  const late = { ...message, id: "m2", name: "Instrucciones de llegada", missing: ["clave_wifi"] as Variable[] };
  const { subject, text } = digestEmail([message], [late], "https://gestor.test");
  assert.equal(subject, "2 mensajes por enviar");
  assert.match(text, /RECORDATORIO · Instrucciones de llegada para Laura Restrepo \(Loft Chapinero\)/);
  assert.match(text, /y sigue sin enviar\./);
  assert.match(text, /Falta en el piso: clave del wifi\./);
});
