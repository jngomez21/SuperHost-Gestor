"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Field } from "@/app/_components/field";
import { FilledText } from "@/app/_components/filled-text";
import { HandNote } from "@/app/_components/hand-note";
import { SubmitButton } from "@/app/_components/submit-button";
import { formatDate, formatDateTime } from "@/app/_lib/format";
import { isTime } from "@/domain/fields";
import { sendAt } from "@/domain/messaging/schedule";
import { messageValues, render, timingLabel, VARIABLES, type Trigger } from "@/domain/messaging/template";
import { addDays, todayInColombia } from "@/domain/reservation/status";
import { saveTemplate, type TemplateFormState } from "./actions";

type Values = { name: string; body: string; trigger: string; dayOffset: string; sendTime: string };
type Place = Parameters<typeof messageValues>[1] & { id: string };

const EMPTY: Values = { name: "", body: "", trigger: "check_in", dayOffset: "-1", sendTime: "10:00" };
const OFFSETS = Array.from({ length: 61 }, (_, i) => i - 30);

// Para quien aún no tiene pisos: la vista previa sale con datos de ejemplo.
const EXAMPLE_PLACE: Place = {
  id: "",
  name: "Loft Chapinero",
  address: "Cra. 7 #60-15, Bogotá",
  wifiName: "Loft-Chapinero",
  wifiPassword: "bienvenida2026",
  accessInstructions: "La llave está en la caja con código 4821, junto a la puerta.",
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

export function TemplateForm({ id, initial, places }: {
  id: string | null;
  initial?: { name: string; body: string; trigger: Trigger; dayOffset: number; sendTime: string | null };
  places: Place[];
}) {
  const [state, action] = useActionState<TemplateFormState, FormData>(saveTemplate.bind(null, id), null);
  const defaults: Values = {
    ...EMPTY,
    ...(initial && {
      ...initial,
      dayOffset: String(initial.dayOffset),
      sendTime: initial.sendTime?.slice(0, 5) ?? EMPTY.sendTime,
    }),
    ...state?.values,
  };
  const [live, setLive] = useState(defaults);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const error = (name: keyof Values | "form") => state?.errors[name];
  const booked = live.trigger === "booked";

  // Los campos de día y hora no existen si toca al reservar: se completan con los de partida.
  const read = (form: HTMLFormElement) =>
    setLive({ ...defaults, ...(Object.fromEntries(new FormData(form)) as Partial<Values>) });

  function insert(variable: string) {
    const box = bodyRef.current;
    if (!box) return;
    box.setRangeText(`{${variable}}`, box.selectionStart, box.selectionEnd, "end");
    box.focus();
    read(box.form!);
  }

  return (
    <div className="editor">
      {/* Un <select> solo toma su valor inicial al montarse: tras un error se remonta con lo enviado. */}
      <form
        key={JSON.stringify(state?.values)}
        action={action}
        className="form"
        noValidate
        onChange={(event) => read(event.currentTarget)}
      >
        {error("form") && <p className="form-error" role="alert">{error("form")}</p>}

        <fieldset className="group">
          <legend className="group-title">El mensaje</legend>
          <Field name="name" label="Nombre" hint="Solo lo ves tú, por ejemplo Instrucciones de llegada." error={error("name")}>
            <input id="name" name="name" className="input" defaultValue={defaults.name} maxLength={60} />
          </Field>
          <Field
            name="body"
            label="Texto"
            hint={
              id
                ? "Lo que va entre llaves se rellena con cada reserva. Los mensajes ya programados que no hayas editado usarán el texto nuevo."
                : "Lo que va entre llaves se rellena con cada reserva."
            }
            error={error("body")}
          >
            <textarea ref={bodyRef} id="body" name="body" className="input" rows={12} maxLength={2000} defaultValue={defaults.body} />
          </Field>
          <div className="field">
            <p className="field-label" id="variables-title">Añadir un dato</p>
            <ul className="variables" aria-labelledby="variables-title">
              {Object.entries(VARIABLES).map(([variable, label]) => (
                <li key={variable}>
                  <button type="button" className="button button-quiet button-small variable" onClick={() => insert(variable)}>
                    <code className="token">{`{${variable}}`}</code>
                    <span className="variable-label">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </fieldset>

        <fieldset className="group">
          <legend className="group-title">Cuándo toca</legend>
          <Field name="trigger" label="Se envía" error={error("trigger")}>
            <select id="trigger" name="trigger" className="input" defaultValue={defaults.trigger}>
              <option value="booked">Al registrar la reserva</option>
              <option value="check_in">Según la llegada</option>
              <option value="check_out">Según la salida</option>
            </select>
          </Field>
          {!booked && (
            <div className="form-row">
              <Field name="dayOffset" label="Día" error={error("dayOffset")}>
                <select id="dayOffset" name="dayOffset" className="input" defaultValue={defaults.dayOffset}>
                  {OFFSETS.map((n) => (
                    <option key={n} value={n}>{timingLabel(live.trigger as Trigger, n)}</option>
                  ))}
                </select>
              </Field>
              <Field name="sendTime" label="Hora" hint="Hora de Colombia." error={error("sendTime")}>
                <input id="sendTime" name="sendTime" type="time" className="input input-time" defaultValue={defaults.sendTime} />
              </Field>
            </div>
          )}
          {id && <p className="field-hint">Un cambio de día u hora vale para las reservas que registres desde ahora.</p>}
        </fieldset>

        <div className="form-actions">
          <SubmitButton pending="Guardando…" skew>{id ? "Guardar cambios" : "Añadir plantilla"}</SubmitButton>
          <Link href="/mensajes" className="button button-quiet">Volver a plantillas</Link>
        </div>
      </form>

      <MessagePreview values={live} places={places.length ? places : [EXAMPLE_PLACE]} />
    </div>
  );
}

function MessagePreview({ values, places }: { values: Values; places: Place[] }) {
  const [placeId, setPlaceId] = useState(places[0].id);
  const place = places.find((p) => p.id === placeId) ?? places[0];
  const today = todayInColombia(new Date());
  const stay = { guestName: "Laura Restrepo", checkIn: addDays(today, 10), checkOut: addDays(today, 13) };
  const { text, missing } = render(values.body, messageValues(stay, place));
  const trigger = values.trigger as Trigger;
  const timing = { trigger, dayOffset: Number(values.dayOffset), sendTime: values.sendTime };
  const when = trigger === "booked"
    ? "en cuanto la registres."
    : isTime(values.sendTime) ? `el ${formatDateTime(sendAt(timing, stay, new Date()))}` : null;

  return (
    <aside className="preview-wrap" aria-labelledby="preview-title">
      <h2 id="preview-title">
        <HandNote arrow="down">Así lo pegarás en Airbnb</HandNote>
      </h2>
      <div className="preview">
        <p className="preview-kicker">
          Ejemplo: Laura llega a {place.name} el {formatDate(stay.checkIn)} y sale el {formatDate(stay.checkOut)}.
        </p>
        {places.length > 1 && (
          <p className="preview-place">
            <label htmlFor="preview-place">Con los datos de</label>
            <select id="preview-place" className="input" value={place.id} onChange={(e) => setPlaceId(e.target.value)}>
              {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </p>
        )}
        <p className="bubble">
          {values.body
            ? <FilledText text={text} />
            : <span className="preview-kicker">Escribe el texto para ver cómo queda.</span>}
        </p>
        {/* La hora formateada ya acaba en punto ("a. m."). */}
        {when && <p className="preview-kicker">Te avisaríamos {when}</p>}
        {missing.length > 0 && place.id && (
          <p className="preview-kicker">
            Este piso no tiene {missing.map((v) => VARIABLES[v]).join(", ")}.{" "}
            <Link href={`/pisos/${place.id}`}>Completar {place.name}</Link>
          </p>
        )}
      </div>
    </aside>
  );
}
