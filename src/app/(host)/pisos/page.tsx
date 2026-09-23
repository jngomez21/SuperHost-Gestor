import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { formatTime } from "@/app/_lib/format";

export default async function PropertiesPage() {
  const host = await requireHost();
  const properties = await listProperties(host.id);

  return (
    <main className="panel">
      <header className="panel-head">
        <div>
          <h1 className="panel-title">Tus pisos</h1>
          <p className="panel-lead">
            Los datos de cada piso se usan en las reservas y, más adelante, en los
            mensajes que recibe el huésped.
          </p>
        </div>
        {properties.length > 0 && <Link href="/pisos/nuevo" className="button">Añadir piso</Link>}
      </header>

      {properties.length === 0 ? (
        <section className="board board-empty" aria-labelledby="empty-title">
          <ul className="board-rail">
            <li className="slot">
              <div className="slot-hook" aria-hidden="true" />
              <div className="tag-ghost" aria-hidden="true" />
            </li>
          </ul>
          <div className="empty-copy">
            <h2 id="empty-title" className="section-title">Aquí colgará tu primer piso</h2>
            <p className="empty-text">Dalo de alta para poder registrar sus reservas.</p>
            <Link href="/pisos/nuevo" className="button">Añadir tu primer piso</Link>
          </div>
        </section>
      ) : (
        <section className="board" aria-label="Pisos">
          <ul className="board-rail">
            {properties.map((property) => (
              <li key={property.id} className="slot">
                <div className="slot-hook" aria-hidden="true" />
                <Link href={`/pisos/${property.id}`} className="tag tag-link">
                  <span className="slot-name">{property.name}</span>
                  <span className="slot-detail">{property.address}</span>
                  <span className="slot-detail">
                    Llegada {formatTime(property.checkInTime)}, salida {formatTime(property.checkOutTime)}
                  </span>
                  <span className="tag-edit">Editar</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
