import Link from "next/link";
import { PropertyForm } from "../property-form";

export default function NewPropertyPage() {
  return (
    <main className="page">
      <p><Link href="/pisos" className="back-link">Tus pisos</Link></p>
      <h1 className="page-title">Añadir <span className="boxed">piso</span></h1>
      <p className="page-lead">
        Solo el nombre y la dirección son obligatorios. Lo demás es lo que tu huésped
        necesita al llegar: cuanto más completo, menos te preguntará.
      </p>
      <PropertyForm id={null} />
    </main>
  );
}
