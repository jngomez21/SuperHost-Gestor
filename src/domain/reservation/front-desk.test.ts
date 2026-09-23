import { test } from "node:test";
import assert from "node:assert/strict";
import { frontDesk } from "./front-desk.ts";
import { addDays, todayInColombia } from "./status.ts";

const loft = { id: "loft", checkInTime: "15:00", checkOutTime: "11:00" };
const casa = { id: "casa", checkInTime: "15:00", checkOutTime: "11:00" };
const stay = (guest: string, propertyId: string, checkIn: string, checkOut: string, cancelled = false) => ({
  guest, propertyId, checkIn, checkOut, cancelledAt: cancelled ? new Date() : null,
});
const at = (local: string) => new Date(`${local}-05:00`);

test("hoy en Colombia no depende de la hora UTC", () => {
  assert.equal(todayInColombia(new Date("2026-10-11T03:00:00Z")), "2026-10-10");
  assert.equal(todayInColombia(new Date("2026-10-11T05:00:00Z")), "2026-10-11");
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
});

test("cambio de huésped: por la mañana Ana sigue dentro y Luis llega hoy", () => {
  const ana = stay("Ana", "loft", "2026-10-05", "2026-10-10");
  const luis = stay("Luis", "loft", "2026-10-10", "2026-10-12");
  const { rack } = frontDesk([loft], [ana, luis], at("2026-10-10T09:00"));
  assert.equal(rack[0].inHouse?.guest, "Ana");
  assert.equal(rack[0].arrivingToday?.guest, "Luis");
  assert.equal(rack[0].leftToday, null);
});

test("cambio de huésped: a mediodía Ana ya salió y el piso espera a Luis", () => {
  const ana = stay("Ana", "loft", "2026-10-05", "2026-10-10");
  const luis = stay("Luis", "loft", "2026-10-10", "2026-10-12");
  const { rack } = frontDesk([loft], [ana, luis], at("2026-10-10T12:00"));
  assert.equal(rack[0].inHouse, null);
  assert.equal(rack[0].leftToday?.guest, "Ana");
  assert.equal(rack[0].arrivingToday?.guest, "Luis");
});

test("piso libre muestra su próxima llegada; las canceladas no cuentan", () => {
  const cancelada = stay("Eva", "casa", "2026-10-11", "2026-10-13", true);
  const proxima = stay("Juan", "casa", "2026-10-15", "2026-10-18");
  const { rack } = frontDesk([casa], [cancelada, proxima], at("2026-10-10T09:00"));
  assert.equal(rack[0].inHouse, null);
  assert.equal(rack[0].arrivingToday, null);
  assert.equal(rack[0].next?.guest, "Juan");
});

test("agenda: 7 días desde hoy, salidas antes que llegadas, sin días vacíos ni canceladas", () => {
  const reservations = [
    stay("Ana", "loft", "2026-10-05", "2026-10-10"),
    stay("Luis", "loft", "2026-10-10", "2026-10-12"),
    stay("Eva", "casa", "2026-10-11", "2026-10-13", true),
    stay("Juan", "casa", "2026-10-16", "2026-10-18"),
    stay("Lejos", "casa", "2026-10-20", "2026-10-22"),
  ];
  const { agenda } = frontDesk([loft, casa], reservations, at("2026-10-10T09:00"));
  assert.deepEqual(
    agenda.map((d) => [d.date, d.movements.map((m) => `${m.kind}:${m.reservation.guest}`)]),
    [
      ["2026-10-10", ["departure:Ana", "arrival:Luis"]],
      ["2026-10-12", ["departure:Luis"]],
      ["2026-10-16", ["arrival:Juan"]],
    ]
  );
});
