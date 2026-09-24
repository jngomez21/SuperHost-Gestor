"use client";

import { useActionState } from "react";
import { Field } from "@/app/_components/field";
import { SubmitButton } from "@/app/_components/submit-button";
import { saveGuideAction, type GuideFormState } from "./actions";

type Fields = Record<string, string>;

// Cada grupo es una sección de la guía, en el orden en que la ve el huésped.
const GROUPS: { title: string; fields: { name: string; label: string; hint?: string; long?: boolean }[] }[] = [
  {
    title: "Ubicación",
    fields: [{
      name: "location",
      label: "Dónde está en el mapa",
      hint: "Pega el enlace de Google Maps del edificio o sus coordenadas (en Google Maps, clic derecho sobre el edificio y copia los números, como 7.0727, -73.1112). Los enlaces cortos maps.app.goo.gl no sirven: ábrelo y copia la dirección completa del navegador.",
    }],
  },
  {
    title: "Wifi y TV",
    fields: [
      { name: "wifiName", label: "Nombre de la red" },
      { name: "wifiPassword", label: "Clave del wifi", hint: "También se usa en tus mensajes." },
      { name: "tvInfo", label: "Televisión", hint: "Canales, apps (Netflix, YouTube…) y cómo encenderla.", long: true },
    ],
  },
  {
    title: "Llegar y entrar",
    fields: [
      { name: "arrivalInfo", label: "Al llegar", hint: "Portería, parqueadero, a quién preguntar.", long: true },
      { name: "accessInstructions", label: "Cómo entrar", hint: "Llaves, código de la cerradura. También se usa en tus mensajes.", long: true },
    ],
  },
  {
    title: "La casa",
    fields: [
      { name: "houseRules", label: "Normas", hint: "Una por línea.", long: true },
      { name: "houseGuide", label: "Cómo funciona", hint: "Agua caliente, ventilador, lavadora, cocina…", long: true },
      { name: "amenities", label: "Qué hay en el apartamento", hint: "Una cosa por línea.", long: true },
      { name: "trashInfo", label: "Basura y reciclaje", long: true },
    ],
  },
  {
    title: "Salida",
    fields: [{ name: "checkoutList", label: "Antes de irte", hint: "Lo que el huésped debe hacer al salir, una cosa por línea.", long: true }],
  },
  {
    title: "Ayuda",
    fields: [
      { name: "transportInfo", label: "Moverse por la ciudad", hint: "Transporte público, taxis, cómo llegar desde el aeropuerto.", long: true },
      { name: "emergencyInfo", label: "Emergencias", hint: "Clínicas y teléfonos útiles. La guía siempre muestra un botón para llamar al 123.", long: true },
    ],
  },
];

export function GuideForm({ propertyId, initial }: { propertyId: string; initial: Fields }) {
  const [state, action] = useActionState<GuideFormState, FormData>(saveGuideAction.bind(null, propertyId), null);
  const values = { ...initial, ...state?.values };
  const error = (name: string) => state?.errors[name];

  return (
    <form action={action} className="form" noValidate>
      {error("form") && <p className="form-error" role="alert">{error("form")}</p>}
      {GROUPS.map((group) => (
        <fieldset key={group.title} className="group">
          <legend className="group-title">{group.title}</legend>
          {group.fields.map((field) => (
            <Field key={field.name} name={field.name} label={field.label} hint={field.hint} error={error(field.name)}>
              {field.long ? (
                <textarea id={field.name} name={field.name} className="input" rows={4} maxLength={2000} defaultValue={values[field.name]} />
              ) : (
                <input id={field.name} name={field.name} className="input" defaultValue={values[field.name]} />
              )}
            </Field>
          ))}
        </fieldset>
      ))}
      <div className="form-actions">
        <SubmitButton pending="Guardando…" skew>Guardar guía</SubmitButton>
        <p className="msg-note" role="status">{state?.saved ? "Guardada. Tus huéspedes ya la ven así." : ""}</p>
      </div>
    </form>
  );
}
