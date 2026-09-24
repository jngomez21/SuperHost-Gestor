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

const arrival = {
  id: "r2",
  guestName: "Pedro Díaz",
  propertyId: "p1",
  propertyName: "Loft Chapinero",
  arrival: new Date("2026-09-25T20:00:00Z"),
  preparation: { done: 3, total: 8, hasChecklist: true },
};

test("resumen: una llegada sin preparar lleva su progreso y el enlace a preparar", () => {
  const { subject, text } = digestEmail([], [], "https://gestor.test", [arrival]);
  assert.equal(subject, "Por preparar: Loft Chapinero para Pedro Díaz");
  assert.match(text, /Llega el viernes, 25 de septiembre, 3:00 p\. m\. y van 3 de 8 tareas\./);
  assert.match(text, /https:\/\/gestor\.test\/reservas\/r2\/preparar/);
});

test("resumen: mensajes y llegadas juntos; un piso sin lista enlaza a crearla", () => {
  const noList = { ...arrival, preparation: { done: 0, total: 0, hasChecklist: false } };
  const { subject, text } = digestEmail([message], [], "https://gestor.test", [noList]);
  assert.equal(subject, "1 mensaje por enviar y 1 piso por preparar");
  assert.match(text, /el piso no tiene lista de preparación\.\nCrear la lista: https:\/\/gestor\.test\/pisos\/p1/);
});
