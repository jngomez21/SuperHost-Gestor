import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { formatTime } from "@/app/_lib/format";
import { HandNote } from "@/app/_components/hand-note";

export default async function PropertiesPage() {
  const host = await requireHost();
  const properties = await listProperties(host.id);

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tus <span className="boxed">pisos</span></h1>
          <p className="page-lead">
            Los datos de cada piso se usan en las reservas y en los mensajes que recibe el huésped.
          </p>
        </div>
        {properties.length > 0 && <Link href="/pisos/nuevo" className="button button-skew">Añadir piso</Link>}
      </header>

      {properties.length === 0 ? (
        <ul className="keyboard keyboard-empty section">
          <li className="keycap keycap-ghost" aria-hidden="true" />
          <li className="keyboard-cta">
            <HandNote arrow="left">Aquí irá tu primer piso</HandNote>
            <p className="section-lead">Dalo de alta para poder registrar sus reservas.</p>
            <Link href="/pisos/nuevo" className="button button-skew">Añadir tu primer piso</Link>
          </li>
        </ul>
      ) : (
        <ul className="keyboard section" aria-label="Pisos">
          {properties.map((property) => (
            <li key={property.id}>
              <Link href={`/pisos/${property.id}`} className="keycap">
                <span className="keycap-name">{property.name}</span>
                <span className="keycap-detail">{property.address}</span>
                <span className="keycap-detail">
                  Llegada {formatTime(property.checkInTime)}, salida {formatTime(property.checkOutTime)}
                </span>
                <span className="keycap-prep">Editar piso y lista</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
