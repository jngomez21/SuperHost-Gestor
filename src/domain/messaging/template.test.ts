import { test } from "node:test";
import assert from "node:assert/strict";
import { messageValues, render, STANDARD_TEMPLATES, timingLabel, validateMessage, validateTemplate } from "./template.ts";

const stay = { guestName: "Marta Gómez Ruiz", checkIn: "2026-09-24", checkOut: "2026-09-27" };
const place = {
  name: "Casa Usaquén",
  address: "Cl 119 #6-20",
  wifiName: "CasaUsaquen",
  wifiPassword: null,
  accessInstructions: "   ",
  checkInTime: "15:00:00",
  checkOutTime: "11:00:00",
};
const values = messageValues(stay, place);

test("relleno: nombre de pila, fecha larga y hora legible", () => {
  const { text, missing } = render("Hola {nombre}, te espero el {llegada} desde las {hora_llegada} en {direccion}.", values);
  assert.equal(text, "Hola Marta, te espero el jueves 24 de septiembre desde las 3:00 p. m. en Cl 119 #6-20.");
  assert.deepEqual(missing, []);
});

test("relleno: un dato vacío se marca a la vista y se lista una vez", () => {
  const { text, missing } = render("Clave: {clave_wifi}. Otra vez: {clave_wifi}. Entrada: {como_entrar}", values);
  assert.equal(text, "Clave: [falta: clave del wifi]. Otra vez: [falta: clave del wifi]. Entrada: [falta: cómo entrar]");
  assert.deepEqual(missing, ["clave_wifi", "como_entrar"]);
});

test("relleno: un dato que acaba en punto no deja dos puntos seguidos", () => {
  assert.equal(render("Entra desde las {hora_llegada}.", values).text, "Entra desde las 3:00 p. m.");
  assert.equal(render("Hora: {hora_llegada}, puntual", values).text, "Hora: 3:00 p. m., puntual");
});

test("relleno: no toca llaves que no son variables", () => {
  assert.equal(render("Precio {especial}", values).text, "Precio {especial}");
});

const template = { name: "Llegada", body: "Hola {nombre}", trigger: "check_in", dayOffset: "-1", sendTime: "10:00" };

test("plantilla válida: convierte los días a número", () => {
  const result = validateTemplate(template);
  assert.ok(result.ok);
  assert.equal(result.value.dayOffset, -1);
});

test("plantilla: avisa de variables que no existen, sin repetirlas", () => {
  const result = validateTemplate({ ...template, body: "Hola {Nombre}, {codigo} y {codigo}" });
  assert.ok(!result.ok);
  assert.equal(result.errors.body, "No conozco {Nombre}, {codigo}. Usa las variables de la lista, en minúsculas.");
});

test("plantilla de bienvenida: ignora días y hora", () => {
  const result = validateTemplate({ ...template, trigger: "booked", dayOffset: "5", sendTime: "" });
  assert.ok(result.ok);
  assert.equal(result.value.dayOffset, 0);
  assert.equal(result.value.sendTime, null);
});

test("plantilla de llegada o salida: exige hora y días entre -30 y 30", () => {
  const result = validateTemplate({ ...template, dayOffset: "-31", sendTime: "" });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["dayOffset", "sendTime"]);
  assert.ok(!validateTemplate({ ...template, trigger: "whenever" }).ok);
});

test("las plantillas estándar pasan su propia validación", () => {
  for (const standard of STANDARD_TEMPLATES) {
    const result = validateTemplate({ ...standard, dayOffset: String(standard.dayOffset), sendTime: standard.sendTime ?? "" });
    assert.ok(result.ok, standard.name);
  }
});

test("mensaje editado: exige texto y lo guarda sin rellenar variables", () => {
  assert.ok(!validateMessage({ body: "  " }).ok);
  const result = validateMessage({ body: " Hola {nombre} " });
  assert.ok(result.ok && result.value.body === "Hola {nombre}");
});

test("cuándo se envía, en palabras", () => {
  assert.equal(timingLabel("booked", 0), "Al registrar la reserva");
  assert.equal(timingLabel("check_in", -1), "El día antes de la llegada");
  assert.equal(timingLabel("check_out", 0), "El día de la salida");
  assert.equal(timingLabel("check_out", 1), "El día después de la salida");
  assert.equal(timingLabel("check_in", -3), "3 días antes de la llegada");
});
