import { test } from "node:test";
import assert from "node:assert/strict";
import { firstName, guestView } from "./guest.ts";

const stay = { guestName: "Pepito Pérez", checkIn: "2026-09-24", checkOut: "2026-09-26", cancelledAt: null };
const schedule = { checkInTime: "15:00:00", checkOutTime: "11:00:00" };
const at = (iso: string) => new Date(`${iso}-05:00`);

test("enlace del huésped: muestra la estancia desde que lo recibe, antes de llegar", () => {
  assert.equal(guestView(stay, schedule, at("2026-09-20T09:00")), "stay");
});

test("enlace del huésped: sigue mostrando la estancia mientras está en casa", () => {
  assert.equal(guestView(stay, schedule, at("2026-09-26T10:59")), "stay");
});

test("enlace del huésped: desde la hora de salida (Colombia) solo agradece", () => {
  assert.equal(guestView(stay, schedule, at("2026-09-26T11:00")), "thanks");
  assert.equal(guestView(stay, schedule, at("2026-10-30T12:00")), "thanks");
});

test("enlace del huésped: una reserva cancelada no muestra nada", () => {
  assert.equal(guestView({ ...stay, cancelledAt: new Date() }, schedule, at("2026-09-25T12:00")), null);
});

test("nombre de pila del huésped", () => {
  assert.equal(firstName("  Pepito   Pérez "), "Pepito");
});
