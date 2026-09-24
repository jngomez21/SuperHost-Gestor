import { test } from "node:test";
import assert from "node:assert/strict";
import { pendingArrivals, prepWarnings, preparation, readyAt, STANDARD_TASKS, validateTaskLabel } from "./checklist.ts";

test("por preparar: llegadas que aún no ocurren y no están listas", () => {
  const preps = new Map([
    ["lista", preparation([{ id: "a" }], ["a"])],
    ["a-medias", preparation([{ id: "a" }, { id: "b" }], ["a"])],
    ["sin-lista", preparation([], [])],
    ["ya-llego", preparation([{ id: "a" }], [])],
  ]);
  const arrivals = [
    { id: "lista", status: "upcoming" },
    { id: "a-medias", status: "upcoming" },
    { id: "sin-lista", status: "upcoming" },
    { id: "ya-llego", status: "in_house" },
  ];
  assert.deepEqual(pendingArrivals(arrivals, preps).map((r) => r.id), ["a-medias", "sin-lista"]);
});

const tasks = [{ id: "sabanas" }, { id: "bano" }, { id: "basura" }];

test("la lista estándar no tiene tareas repetidas", () => {
  assert.equal(new Set(STANDARD_TASKS).size, STANDARD_TASKS.length);
});

test("progreso: cuenta solo las tareas actuales del piso", () => {
  assert.deepEqual(preparation(tasks, ["sabanas", "tarea-borrada"]), {
    done: 1, total: 3, ready: false, hasChecklist: true,
  });
});

test("lista cuando todas las tareas están marcadas", () => {
  assert.equal(preparation(tasks, ["sabanas", "bano", "basura"]).ready, true);
});

test("añadir una tarea nueva deja pendiente una llegada que estaba lista", () => {
  const withNew = [...tasks, { id: "cafe" }];
  assert.equal(preparation(withNew, ["sabanas", "bano", "basura"]).ready, false);
});

test("un piso sin tareas no cuenta como listo", () => {
  assert.deepEqual(preparation([], []), { done: 0, total: 0, ready: false, hasChecklist: false });
});

test("tarea: exige texto y como máximo 80 caracteres", () => {
  assert.ok(!validateTaskLabel({ label: "   " }).ok);
  assert.ok(!validateTaskLabel({ label: "x".repeat(81) }).ok);
  const ok = validateTaskLabel({ label: "  Regar las plantas " });
  assert.ok(ok.ok && ok.value.label === "Regar las plantas");
});

const times = { checkInTime: "15:00", checkOutTime: "11:00", cancelledAt: null as Date | null, prepWarnedAt: null as Date | null };
const pedro = { ...times, id: "pedro", propertyId: "loft", checkIn: "2026-09-25", checkOut: "2026-09-27" };
const at = (iso: string) => new Date(`${iso}-05:00`);
const warned = (stays: (typeof pedro)[], now: Date, preps = new Map()) => prepWarnings(stays, preps, now).map((s) => s.id);

test("aviso de preparación: con el piso vacío, 24 h antes de la llegada", () => {
  const before = { ...times, id: "ana", propertyId: "loft", checkIn: "2026-09-18", checkOut: "2026-09-20" };
  assert.deepEqual(warned([before, pedro], at("2026-09-24T14:59")), []);
  assert.deepEqual(warned([before, pedro], at("2026-09-24T15:00")), ["pedro"]);
});

test("aviso de preparación: con cambio de huésped el mismo día, cuando sale el anterior", () => {
  const ana = { ...times, id: "ana", propertyId: "loft", checkIn: "2026-09-22", checkOut: "2026-09-25" };
  const otherFlat = { ...ana, id: "otro-piso", propertyId: "casa" };
  assert.deepEqual(warned([ana, pedro], at("2026-09-24T15:00")), []);
  assert.deepEqual(warned([otherFlat, pedro], at("2026-09-24T15:00")), ["pedro"]);
  assert.deepEqual(warned([ana, pedro], at("2026-09-25T11:00")), ["pedro"]);
  assert.deepEqual(warned([{ ...ana, cancelledAt: new Date() }, pedro], at("2026-09-24T15:00")), ["pedro"]);
});

test("aviso de preparación: nunca si está lista, ya se avisó, está cancelada o ya llegó", () => {
  const now = at("2026-09-25T12:00");
  assert.deepEqual(warned([pedro], now, new Map([["pedro", preparation([{ id: "a" }], ["a"])]])), []);
  assert.deepEqual(warned([pedro], now, new Map([["pedro", preparation([], [])]])), ["pedro"]);
  assert.deepEqual(warned([{ ...pedro, prepWarnedAt: now }], now), []);
  assert.deepEqual(warned([{ ...pedro, cancelledAt: now }], now), []);
  assert.deepEqual(warned([pedro], at("2026-09-25T15:00")), []);
});

test("métrica: listo a la llegada solo si la lista de entonces estaba marcada antes", () => {
  const arrival = at("2026-09-25T15:00");
  const tasks = [{ id: "a", createdAt: at("2026-09-01T00:00") }, { id: "nueva", createdAt: at("2026-09-26T00:00") }];
  assert.equal(readyAt(tasks, [{ taskId: "a", doneAt: at("2026-09-25T12:00") }], arrival), true);
  assert.equal(readyAt(tasks, [{ taskId: "a", doneAt: at("2026-09-25T16:00") }], arrival), false);
  assert.equal(readyAt([], [], arrival), false);
});
