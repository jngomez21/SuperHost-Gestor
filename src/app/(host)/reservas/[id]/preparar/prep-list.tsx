"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { toggleTaskAction } from "../../actions";

type Task = { id: string; label: string; doneAt: string | null };

const timeFormat = new Intl.DateTimeFormat("es-CO", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Bogota",
});

export function PrepList({ reservationId, guestFirstName, arrival, tasks, readOnly }: {
  reservationId: string;
  guestFirstName: string;
  arrival: string;
  tasks: Task[];
  readOnly: boolean;
}) {
  const [saving, startTransition] = useTransition();

  // Las marcas se guardan en cola; si el host cierra la página a mitad, se perderían.
  useEffect(() => {
    if (!saving) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saving]);
  const [optimistic, setOptimistic] = useOptimistic(
    tasks,
    (state, { id, done }: { id: string; done: boolean }) =>
      state.map((t) => (t.id === id ? { ...t, doneAt: done ? new Date().toISOString() : null } : t))
  );

  const done = optimistic.filter((t) => t.doneAt).length;
  const total = optimistic.length;
  const ready = total > 0 && done === total;

  // Solo la casilla que acaba de marcar el host celebra; las que ya venían marcadas no.
  const [justChecked, setJustChecked] = useState<string | null>(null);

  function toggle(id: string, value: boolean) {
    setJustChecked(value ? id : null);
    startTransition(async () => {
      setOptimistic({ id, done: value });
      await toggleTaskAction(reservationId, id, value);
    });
  }

  return (
    <>
      <div className="prep-head">
        <p className="prep-for">{arrival}</p>
        <p className="prep-count" aria-live="polite">
          <strong>{done} de {total}</strong> tareas hechas
          {saving && <span className="prep-saving">Guardando…</span>}
        </p>
        <div className="prep-bar" aria-hidden="true">
          <div className="prep-bar-fill" style={{ width: total ? `${(done / total) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="prep-sheet">
        {ready && <p className="prep-stamp" role="status">Listo para {guestFirstName}</p>}

        {total === 0 ? (
          <p className="sheet-empty">Este piso no tiene lista de preparación. Añádela desde la ficha del piso.</p>
        ) : (
          <ul className="prep-list">
            {optimistic.map((task) => (
              <li key={task.id}>
                <label className={`prep-row${task.doneAt ? " prep-row-done" : ""}${task.id === justChecked ? " prep-row-pop" : ""}`}>
                  <input
                    type="checkbox"
                    className="prep-input"
                    checked={Boolean(task.doneAt)}
                    disabled={readOnly}
                    onChange={(event) => toggle(task.id, event.target.checked)}
                  />
                  <span className="prep-box" aria-hidden="true" />
                  <span className="prep-label">{task.label}</span>
                  {task.doneAt && (
                    <span className="prep-time">hecho {timeFormat.format(new Date(task.doneAt))}</span>
                  )}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
