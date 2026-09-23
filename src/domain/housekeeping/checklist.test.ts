import { test } from "node:test";
import assert from "node:assert/strict";
import { preparation, STANDARD_TASKS, validateTaskLabel } from "./checklist.ts";

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
