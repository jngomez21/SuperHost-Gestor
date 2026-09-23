import { PropertyForm } from "../property-form";

export default function NewPropertyPage() {
  return (
    <main className="panel">
      <h1 className="panel-title">Añadir piso</h1>
      <p className="panel-lead">
        Solo el nombre y la dirección son obligatorios. Lo demás es lo que tu huésped
        necesita al llegar: cuanto más completo, menos te preguntará.
      </p>
      <PropertyForm id={null} />
    </main>
  );
}
