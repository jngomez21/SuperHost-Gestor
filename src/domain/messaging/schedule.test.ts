import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchPlan, messageStatus, sendAt } from "./schedule.ts";

const stay = { checkIn: "2026-10-01", checkOut: "2026-10-04" };
const registeredAt = new Date("2026-09-23T20:00:00Z");

test("hora de envío: días respecto a la llegada o la salida, en hora de Colombia", () => {
  assert.equal(sendAt({ trigger: "check_in", dayOffset: -1, sendTime: "10:00" }, stay, registeredAt).toISOString(), "2026-09-30T15:00:00.000Z");
  assert.equal(sendAt({ trigger: "check_out", dayOffset: 0, sendTime: "14:00:00" }, stay, registeredAt).toISOString(), "2026-10-04T19:00:00.000Z");
});

test("hora de envío: la bienvenida toca al registrar la reserva", () => {
  assert.equal(sendAt({ trigger: "booked", dayOffset: 0, sendTime: null }, stay, registeredAt), registeredAt);
});

const now = new Date("2026-09-30T15:00:00Z");
const base = { sendAt: now, sentAt: null, cancelledAt: null, reservationCancelled: false };

test("estado: programado hasta su hora, por enviar desde ella", () => {
  assert.equal(messageStatus({ ...base, sendAt: new Date(now.getTime() + 1) }, now), "scheduled");
  assert.equal(messageStatus(base, now), "due");
});

test("estado: cancelar la reserva cancela lo pendiente, pero lo enviado sigue enviado", () => {
  assert.equal(messageStatus({ ...base, reservationCancelled: true }, now), "cancelled");
  assert.equal(messageStatus({ ...base, cancelledAt: now }, now), "cancelled");
  assert.equal(messageStatus({ ...base, sentAt: now, reservationCancelled: true }, now), "sent");
});

const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
const pending = { ...base, notifiedAt: null, remindedAt: null };

test("despacho: avisa de lo que acaba de tocar y recuerda una vez a las 3 h", () => {
  const messages = [
    { ...pending, id: "nuevo" },
    { ...pending, id: "avisado-hace-1h", notifiedAt: hoursAgo(1) },
    { ...pending, id: "avisado-hace-3h", notifiedAt: hoursAgo(3) },
    { ...pending, id: "ya-recordado", notifiedAt: hoursAgo(5), remindedAt: hoursAgo(2) },
    { ...pending, id: "futuro", sendAt: new Date(now.getTime() + 60_000) },
    { ...pending, id: "enviado", sentAt: now },
    { ...pending, id: "reserva-cancelada", reservationCancelled: true },
  ];
  const plan = dispatchPlan(messages, now);
  assert.deepEqual(plan.notify.map((m) => m.id), ["nuevo"]);
  assert.deepEqual(plan.remind.map((m) => m.id), ["avisado-hace-3h"]);
});
