"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/app/_components/submit-button";
import { addTaskAction, removeTaskAction, renameTaskAction, type PropertyFormState } from "./actions";

type Task = { id: string; label: string };

export function TaskEditor({ propertyId, tasks }: { propertyId: string; tasks: Task[] }) {
  const [state, add] = useActionState<PropertyFormState, FormData>(addTaskAction.bind(null, propertyId), null);
  const addError = state?.errors.label ?? state?.errors.form;

  return (
    <section className="sheet" aria-labelledby="sheet-title">
      <h2 id="sheet-title" className="sheet-title">Lista de preparación</h2>
      <p className="sheet-lead">
        Lo que hay que dejar hecho antes de cada llegada. Al preparar una reserva marcarás estas tareas una a una.
      </p>

      {tasks.length === 0 ? (
        <p className="sheet-empty">
          Este piso no tiene tareas. Sin lista, sus llegadas no pueden darse por preparadas.
        </p>
      ) : (
        <ul className="sheet-list">
          {tasks.map((task) => <TaskRow key={task.id} propertyId={propertyId} task={task} />)}
        </ul>
      )}

      <form action={add} className="sheet-add" noValidate>
        <label htmlFor="new-task" className="field-label">Añadir tarea</label>
        <div className="sheet-add-row">
          <input
            id="new-task"
            name="label"
            className="input"
            placeholder="Por ejemplo: regar las plantas"
            maxLength={80}
            aria-invalid={addError ? true : undefined}
            aria-describedby={addError ? "new-task-error" : undefined}
          />
          <SubmitButton pending="Añadiendo…">Añadir</SubmitButton>
        </div>
        {addError && <p id="new-task-error" className="field-error" role="alert">{addError}</p>}
      </form>
    </section>
  );
}

function TaskRow({ propertyId, task }: { propertyId: string; task: Task }) {
  const [editing, setEditing] = useState(false);
  const [state, rename] = useActionState<PropertyFormState, FormData>(
    async (previous, formData) => {
      const result = await renameTaskAction(propertyId, task.id, previous, formData);
      if (!result) setEditing(false);
      return result;
    },
    null
  );
  const error = state?.errors.label ?? state?.errors.form;
  const inputId = `task-${task.id}`;

  if (editing) {
    return (
      <li className="sheet-row">
        <form action={rename} className="sheet-edit" noValidate>
          <label htmlFor={inputId} className="visually-hidden">Nuevo nombre de la tarea</label>
          <input
            id={inputId}
            name="label"
            className="input"
            defaultValue={state?.values.label ?? task.label}
            maxLength={80}
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          <SubmitButton pending="Guardando…">Guardar</SubmitButton>
          <button type="button" className="button button-quiet" onClick={() => setEditing(false)}>Cancelar</button>
          {error && <p id={`${inputId}-error`} className="field-error" role="alert">{error}</p>}
        </form>
      </li>
    );
  }

  return (
    <li className="sheet-row">
      <span className="sheet-box" aria-hidden="true" />
      <span className="sheet-label">{task.label}</span>
      <span className="sheet-actions">
        <button type="button" className="link-button" onClick={() => setEditing(true)}>
          Renombrar<span className="visually-hidden"> {task.label}</span>
        </button>
        <form action={removeTaskAction.bind(null, propertyId, task.id)}>
          <button type="submit" className="link-button link-button-danger">
            Quitar<span className="visually-hidden"> {task.label}</span>
          </button>
        </form>
      </span>
    </li>
  );
}
