import { test } from "node:test";
import assert from "node:assert/strict";
import { reservationStatus } from "./status.ts";

const schedule = { checkInTime: "15:00", checkOutTime: "11:00" };
const stay = { checkIn: "2026-10-10", checkOut: "2026-10-15", cancelledAt: null };
const at = (local: string) => new Date(`${local}-05:00`);

test("antes de la hora de llegada: próxima", () => {
  assert.equal(reservationStatus(stay, schedule, at("2026-10-01T09:00")), "upcoming");
  assert.equal(reservationStatus(stay, schedule, at("2026-10-10T14:59")), "upcoming");
});

test("desde la hora de llegada hasta antes de la de salida: huésped en casa", () => {
  assert.equal(reservationStatus(stay, schedule, at("2026-10-10T15:00")), "in_house");
  assert.equal(reservationStatus(stay, schedule, at("2026-10-13T03:00")), "in_house");
  assert.equal(reservationStatus(stay, schedule, at("2026-10-15T10:59")), "in_house");
});

test("desde la hora de salida: terminada", () => {
  assert.equal(reservationStatus(stay, schedule, at("2026-10-15T11:00")), "finished");
  assert.equal(reservationStatus(stay, schedule, at("2026-12-01T00:00")), "finished");
});

test("cancelada gana a cualquier fecha, incluso durante la estancia", () => {
  const cancelled = { ...stay, cancelledAt: new Date("2026-10-01T00:00:00Z") };
  assert.equal(reservationStatus(cancelled, schedule, at("2026-10-12T12:00")), "cancelled");
});

test("las horas vienen de Postgres con segundos (15:00:00)", () => {
  const fromDb = { checkInTime: "15:00:00", checkOutTime: "11:00:00" };
  assert.equal(reservationStatus(stay, fromDb, at("2026-10-10T15:00")), "in_house");
});

test("la hora se interpreta en Colombia, no en UTC ni en la zona del servidor", () => {
  assert.equal(reservationStatus(stay, schedule, new Date("2026-10-10T19:59:00Z")), "upcoming");
  assert.equal(reservationStatus(stay, schedule, new Date("2026-10-10T20:00:00Z")), "in_house");
});
