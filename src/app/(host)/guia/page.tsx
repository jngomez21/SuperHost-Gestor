import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { HandNote } from "@/app/_components/hand-note";

export default async function GuidesPage() {
  const host = await requireHost();
  const properties = await listProperties(host.id);

  return (
    <main className="page">
      <h1 className="page-title">La guía del <span className="boxed">huésped</span></h1>
      <p className="page-lead">
        Lo que ven tus huéspedes con su enlace: fotos, mapa, wifi, normas y lugares cercanos. Cada piso tiene la
        suya y la ven todos sus huéspedes.
      </p>

      {properties.length === 0 ? (
        <ul className="keyboard keyboard-empty section">
          <li className="keycap keycap-ghost" aria-hidden="true" />
          <li className="keyboard-cta">
            <HandNote arrow="left">Primero, un piso</HandNote>
            <Link href="/pisos/nuevo" className="button button-skew">Añadir tu primer piso</Link>
          </li>
        </ul>
      ) : (
        <ul className="keyboard section" aria-label="Guías por piso">
          {properties.map((property) => (
            <li key={property.id}>
              <Link href={`/guia/${property.id}`} className="keycap">
                <span className="keycap-name">{property.name}</span>
                <span className="keycap-detail">{property.address}</span>
                <span className="keycap-prep">Editar la guía</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
