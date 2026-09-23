"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/app/_components/field";
import { HandNote } from "@/app/_components/hand-note";
import { SubmitButton } from "@/app/_components/submit-button";
import { formatTime } from "@/app/_lib/format";
import { saveProperty, type PropertyFormState } from "./actions";

type Values = {
  name: string;
  address: string;
  wifiName: string | null;
  wifiPassword: string | null;
  accessInstructions: string | null;
  checkInTime: string;
  checkOutTime: string;
};

const EMPTY: Values = {
  name: "",
  address: "",
  wifiName: "",
  wifiPassword: "",
  accessInstructions: "",
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

function normalize(values: Values): Record<keyof Values, string> {
  return {
    name: values.name,
    address: values.address,
    wifiName: values.wifiName ?? "",
    wifiPassword: values.wifiPassword ?? "",
    accessInstructions: values.accessInstructions ?? "",
    checkInTime: values.checkInTime.slice(0, 5),
    checkOutTime: values.checkOutTime.slice(0, 5),
  };
}

export function PropertyForm({ id, initial = EMPTY }: { id: string | null; initial?: Values }) {
  const [state, action] = useActionState<PropertyFormState, FormData>(saveProperty.bind(null, id), null);
  const defaults = { ...normalize(initial), ...state?.values };
  const [preview, setPreview] = useState(defaults);
  const error = (name: keyof Values | "form") => state?.errors[name];

  return (
    <div className="editor">
      <form
        action={action}
        className="form"
        noValidate
        onChange={(event) =>
          setPreview(Object.fromEntries(new FormData(event.currentTarget)) as typeof preview)
        }
      >
        {error("form") && <p className="form-error" role="alert">{error("form")}</p>}

        <fieldset className="group">
          <legend className="group-title">El piso</legend>
          <Field name="name" label="Nombre" hint="Como lo llamas tú, por ejemplo Loft Chapinero." error={error("name")}>
            <input id="name" name="name" className="input" defaultValue={defaults.name} required maxLength={80} />
          </Field>
          <Field name="address" label="Dirección" error={error("address")}>
            <input id="address" name="address" className="input" defaultValue={defaults.address} required autoComplete="street-address" />
          </Field>
        </fieldset>

        <fieldset className="group">
          <legend className="group-title">Al llegar</legend>
          <Field name="checkInTime" label="Puede entrar desde" error={error("checkInTime")}>
            <input id="checkInTime" name="checkInTime" type="time" className="input input-time" defaultValue={defaults.checkInTime} />
          </Field>
          <Field
            name="accessInstructions"
            label="Cómo entra"
            hint="Dónde está la llave, el código de la cerradura, qué decir en portería."
            error={error("accessInstructions")}
          >
            <textarea id="accessInstructions" name="accessInstructions" className="input" rows={4} defaultValue={defaults.accessInstructions} />
          </Field>
        </fieldset>

        <fieldset className="group">
          <legend className="group-title">Wifi</legend>
          <div className="form-row">
            <Field name="wifiName" label="Nombre de la red" error={error("wifiName")}>
              <input id="wifiName" name="wifiName" className="input" defaultValue={defaults.wifiName} />
            </Field>
            <Field name="wifiPassword" label="Clave" error={error("wifiPassword")}>
              <input id="wifiPassword" name="wifiPassword" className="input" defaultValue={defaults.wifiPassword} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="group">
          <legend className="group-title">Al irse</legend>
          <Field name="checkOutTime" label="Tiene que salir antes de" error={error("checkOutTime")}>
            <input id="checkOutTime" name="checkOutTime" type="time" className="input input-time" defaultValue={defaults.checkOutTime} />
          </Field>
        </fieldset>

        <div className="form-actions">
          <SubmitButton pending="Guardando…" skew>{id ? "Guardar cambios" : "Añadir piso"}</SubmitButton>
          <Link href="/pisos" className="button button-quiet">Volver a pisos</Link>
        </div>
      </form>

      <GuestPreview values={preview} />
    </div>
  );
}

function GuestPreview({ values }: { values: Record<keyof Values, string> }) {
  const missing = <span className="preview-missing">Falta: tu huésped te lo preguntará</span>;
  return (
    <aside className="preview-wrap" aria-labelledby="preview-title">
      <h2 id="preview-title">
        <HandNote arrow="down">Así lo verá tu huésped</HandNote>
      </h2>
      <div className="preview">
        <p className="preview-kicker">Bienvenido a</p>
        <p className="preview-name">{values.name || "Tu piso"}</p>
        <p className="preview-address">{values.address || "Dirección del piso"}</p>
        <dl className="preview-facts">
          <div className="preview-fact">
            <dt>Llegada</dt>
            <dd>desde las {values.checkInTime ? formatTime(values.checkInTime) : "—"}</dd>
          </div>
          <div className="preview-fact">
            <dt>Salida</dt>
            <dd>antes de las {values.checkOutTime ? formatTime(values.checkOutTime) : "—"}</dd>
          </div>
          <div className="preview-fact preview-fact-wide">
            <dt>Wifi</dt>
            <dd>
              {values.wifiName ? (
                <>
                  {values.wifiName}
                  {values.wifiPassword && <span className="preview-secret">Clave {values.wifiPassword}</span>}
                </>
              ) : missing}
            </dd>
          </div>
          <div className="preview-fact preview-fact-wide">
            <dt>Cómo entrar</dt>
            <dd className="preview-long">{values.accessInstructions || missing}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
