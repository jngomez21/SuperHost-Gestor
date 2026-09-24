"use client";

import { useActionState } from "react";
import { Field } from "@/app/_components/field";
import { SubmitButton } from "@/app/_components/submit-button";
import { PLACE_CATEGORIES } from "@/domain/property/guide";
import { addPlaceAction, removePlaceAction, type GuideFormState } from "./actions";

type Place = { id: string; name: string; category: string; distance: string | null; note: string | null };

export function PlacesEditor({ propertyId, places }: { propertyId: string; places: Place[] }) {
  const [state, action] = useActionState<GuideFormState, FormData>(addPlaceAction.bind(null, propertyId), null);
  const error = (name: string) => state?.errors[name];

  return (
    <section className="section" aria-labelledby="places-title">
      <h2 id="places-title" className="section-title">Lugares cercanos</h2>
      <p className="section-lead">Salen agrupados por tipo, con un botón que abre en Google Maps cómo llegar desde el piso.</p>

      {places.length > 0 && (
        <ul className="ledger">
          {places.map((place) => (
            <li key={place.id} className="place-row">
              <div>
                <p className="ledger-guest">{place.name}</p>
                <p className="ledger-property">{[place.category, place.distance].filter(Boolean).join(" · ")}</p>
              </div>
              <form action={removePlaceAction.bind(null, propertyId, place.id)}>
                <button type="submit" className="link-button link-button-danger">
                  Quitar<span className="visually-hidden"> {place.name}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {/* Tras añadir, el formulario se vacía: la key cambia con la lista. */}
      <form key={places.length} action={action} className="form form-single" noValidate>
        <fieldset className="group">
          <legend className="group-title">Añadir un lugar</legend>
          {error("form") && <p className="form-error" role="alert">{error("form")}</p>}
          <div className="form-row">
            <Field name="place-name" label="Nombre" error={error("name")}>
              <input id="place-name" name="name" className="input" defaultValue={state?.values.name} maxLength={80} />
            </Field>
            <Field name="place-category" label="Tipo" error={error("category")}>
              <select id="place-category" name="category" className="input" defaultValue={state?.values.category ?? PLACE_CATEGORIES[0]}>
                {PLACE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field name="place-distance" label="Distancia" hint="Por ejemplo: 300 m, 4 min a pie." error={error("distance")}>
              <input id="place-distance" name="distance" className="input" defaultValue={state?.values.distance} maxLength={40} />
            </Field>
            <Field name="place-query" label="Búsqueda en Google Maps" hint="Opcional: dirección o coordenadas. Si no, se busca el nombre." error={error("mapsQuery")}>
              <input id="place-query" name="mapsQuery" className="input" defaultValue={state?.values.mapsQuery} maxLength={200} />
            </Field>
          </div>
          <Field name="place-note" label="Nota" hint="Opcional: por qué merece la pena." error={error("note")}>
            <input id="place-note" name="note" className="input" defaultValue={state?.values.note} maxLength={200} />
          </Field>
          <div>
            <SubmitButton pending="Añadiendo…">Añadir lugar</SubmitButton>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
