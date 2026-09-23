"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Field } from "@/app/_components/field";
import { SubmitButton } from "@/app/_components/submit-button";
import { formatDate, formatTime } from "@/app/_lib/format";
import { nights } from "@/domain/reservation/status";
import { createReservationAction, type FormState } from "./actions";

type PropertyOption = { id: string; name: string; checkInTime: string; checkOutTime: string };

export function ReservationForm({ properties, preselected }: { properties: PropertyOption[]; preselected?: string }) {
  const [state, action] = useActionState<FormState, FormData>(createReservationAction, null);
  const defaults: Record<string, string> = {
    propertyId: preselected ?? (properties.length === 1 ? properties[0].id : ""),
    guestCount: "1",
    ...state?.values,
  };
  const [live, setLive] = useState(defaults);
  const error = (name: string) => state?.errors[name];
  const value = (name: string) => defaults[name] ?? "";

  return (
    <form
      action={action}
      className="form form-single"
      noValidate
      onChange={(event) => setLive(Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>)}
    >
      {error("form") && <p className="form-error" role="alert">{error("form")}</p>}

      <fieldset className="group">
        <legend className="group-title">Piso y fechas</legend>
        <Field name="propertyId" label="Piso" error={error("propertyId")}>
          <select id="propertyId" name="propertyId" className="input" defaultValue={value("propertyId")}>
            <option value="" disabled>Elige un piso</option>
            {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <div className="form-row">
          <Field name="checkIn" label="Llegada" error={error("checkIn")}>
            <input id="checkIn" name="checkIn" type="date" className="input" defaultValue={value("checkIn")} />
          </Field>
          <Field name="checkOut" label="Salida" error={error("checkOut")}>
            <input id="checkOut" name="checkOut" type="date" className="input" defaultValue={value("checkOut")} />
          </Field>
        </div>
        <StaySummary values={live} properties={properties} />
      </fieldset>

      <fieldset className="group">
        <legend className="group-title">Huésped</legend>
        <Field name="guestName" label="Nombre" error={error("guestName")}>
          <input id="guestName" name="guestName" className="input" defaultValue={value("guestName")} autoComplete="off" />
        </Field>
        <div className="form-row">
          <Field name="guestEmail" label="Email" hint="Opcional: Airbnb no lo comparte." error={error("guestEmail")}>
            <input id="guestEmail" name="guestEmail" type="email" className="input" defaultValue={value("guestEmail")} autoComplete="off" />
          </Field>
          <Field name="guestPhone" label="Teléfono" hint="Opcional." error={error("guestPhone")}>
            <input id="guestPhone" name="guestPhone" type="tel" className="input" defaultValue={value("guestPhone")} autoComplete="off" />
          </Field>
        </div>
        <Field name="guestCount" label="Número de huéspedes" error={error("guestCount")}>
          <input id="guestCount" name="guestCount" type="number" min={1} max={50} className="input input-time" defaultValue={value("guestCount")} />
        </Field>
      </fieldset>

      <div className="form-actions">
        <SubmitButton pending="Registrando…" skew>Registrar reserva</SubmitButton>
        <Link href="/reservas" className="button button-quiet">Volver a reservas</Link>
      </div>
    </form>
  );
}

function StaySummary({ values, properties }: { values: Record<string, string>; properties: PropertyOption[] }) {
  const property = properties.find((p) => p.id === values.propertyId);
  const { checkIn, checkOut } = values;
  if (!checkIn || !checkOut) {
    return <p className="stay stay-empty">Elige las dos fechas para ver la estancia.</p>;
  }
  const count = nights(checkIn, checkOut);
  if (count < 1) {
    return <p className="stay stay-wrong">La salida tiene que ser después de la llegada.</p>;
  }
  return (
    <p className="stay" aria-live="polite">
      Del <strong>{formatDate(checkIn)}</strong>
      {property && <>, desde las {formatTime(property.checkInTime)},</>} al <strong>{formatDate(checkOut)}</strong>
      {property && <>, antes de las {formatTime(property.checkOutTime)}</>}
      <span className="stay-nights">{count} {count === 1 ? "noche" : "noches"}</span>
    </p>
  );
}
