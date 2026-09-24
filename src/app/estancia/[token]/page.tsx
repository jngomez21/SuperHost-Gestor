import { notFound } from "next/navigation";
import { getGuestStay } from "@/application/reservations";
import { formatLongDate, formatTime } from "@/app/_lib/format";

// Provisional (Fase 5): el contenido y el diseño de estas vistas los define el host.
export default async function GuestStayPage({ params }: PageProps<"/estancia/[token]">) {
  const { token } = await params;
  const stay = await getGuestStay(token);
  if (!stay) notFound();

  if (stay.view === "thanks") {
    return (
      <main className="entry">
        <h1 className="entry-title">Gracias por quedarte en {stay.propertyName}, {stay.firstName}</h1>
        <p className="entry-lead">
          Tu estancia terminó. Si te gustó, deja tu reseña desde la app de Airbnb: Viajes, tu estancia, Escribir reseña.
        </p>
      </main>
    );
  }

  const rows = [
    ["Dirección", stay.address],
    ["Cómo entrar", stay.accessInstructions],
    ["Wifi", stay.wifiName],
    ["Clave del wifi", stay.wifiPassword],
  ].filter((row): row is [string, string] => Boolean(row[1]?.trim()));

  return (
    <main className="page">
      <h1 className="page-title">Hola, <span className="boxed">{stay.firstName}</span></h1>
      <p className="page-lead">Todo lo de tu estancia en {stay.propertyName}.</p>

      <article className="card">
        <dl className="card-stay">
          <div>
            <dt>Llegada</dt>
            <dd>{formatLongDate(stay.checkIn)}</dd>
            <dd className="card-sub">desde las {formatTime(stay.checkInTime)}</dd>
          </div>
          <div>
            <dt>Salida</dt>
            <dd>{formatLongDate(stay.checkOut)}</dd>
            <dd className="card-sub">antes de las {formatTime(stay.checkOutTime)}</dd>
          </div>
        </dl>
        <dl className="card-contact">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className="log-body">{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </main>
  );
}
