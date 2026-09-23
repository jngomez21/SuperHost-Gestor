import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProperty } from "./property/validate.ts";
import { validateNote, validateReservation } from "./reservation/validate.ts";

const property = { name: " Loft Chapinero ", address: "Cra 7 #60-10" };
const reservation = {
  propertyId: "3f2b8c1e-9a4d-4e2b-8c1f-2a3b4c5d6e7f",
  guestName: "Ana Ruiz",
  guestEmail: "Ana@Correo.com",
  guestCount: "2",
  checkIn: "2026-10-10",
  checkOut: "2026-10-15",
};

test("piso: recorta espacios y pone las horas por defecto", () => {
  const result = validateProperty(property);
  assert.ok(result.ok);
  assert.equal(result.value.name, "Loft Chapinero");
  assert.equal(result.value.checkInTime, "15:00");
  assert.equal(result.value.checkOutTime, "11:00");
  assert.equal(result.value.wifiName, null);
});

test("piso: exige nombre y dirección, y horas válidas", () => {
  const result = validateProperty({ name: "  ", checkInTime: "25:00" });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["address", "checkInTime", "name"]);
});

test("reserva válida: normaliza email y convierte huéspedes a número", () => {
  const result = validateReservation(reservation);
  assert.ok(result.ok);
  assert.equal(result.value.guestEmail, "ana@correo.com");
  assert.equal(result.value.guestCount, 2);
  assert.equal(result.value.guestPhone, null);
});

test("reserva: el email es opcional porque Airbnb no lo comparte", () => {
  const result = validateReservation({ ...reservation, guestEmail: "  " });
  assert.ok(result.ok);
  assert.equal(result.value.guestEmail, null);
});

test("reserva: la salida tiene que ser posterior a la llegada", () => {
  const same = validateReservation({ ...reservation, checkOut: "2026-10-10" });
  assert.ok(!same.ok);
  assert.ok(same.errors.checkOut);
});

test("reserva: rechaza fechas imposibles, email mal formado y 0 huéspedes", () => {
  const result = validateReservation({
    ...reservation,
    checkIn: "2026-02-30",
    guestEmail: "ana@correo",
    guestCount: "0",
  });
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors).sort(), ["checkIn", "guestCount", "guestEmail"]);
});

test("reserva: sin piso elegido no pasa", () => {
  const result = validateReservation({ ...reservation, propertyId: "" });
  assert.ok(!result.ok);
  assert.ok(result.errors.propertyId);
});

test("nota: no acepta texto vacío", () => {
  assert.ok(!validateNote({ body: "   " }).ok);
  assert.ok(validateNote({ body: "Pidió llegar a las 22:00" }).ok);
});
