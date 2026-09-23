import Link from "next/link";
import { listReservations } from "@/application/reservations";
import { requireHost } from "@/app/_lib/host";
import { formatDate, STATUS_LABEL } from "@/app/_lib/format";
import { nights } from "@/domain/reservation/status";

export default async function ReservationsPage() {
  const host = await requireHost();
  const reservations = await listReservations(host.id);
  const active = reservations.filter((r) => r.status === "upcoming" || r.status === "in_house");
  const past = reservations.filter((r) => r.status === "finished" || r.status === "cancelled").reverse();

  return (
    <main className="panel">
      <header className="panel-head">
        <div>
          <h1 className="panel-title">Libro de huéspedes</h1>
          <p className="panel-lead">Todas tus reservas, con sus notas. Las terminadas y canceladas quedan abajo como historial.</p>
        </div>
        <Link href="/reservas/nueva" className="button">Registrar reserva</Link>
      </header>

      {reservations.length === 0 ? (
        <p className="ledger-empty">Todavía no hay reservas. Registra la primera cuando te llegue una en Airbnb.</p>
      ) : (
        <>
          <Ledger title="Próximas y en curso" items={active} empty="No tienes reservas próximas." />
          {past.length > 0 && <Ledger title="Historial" items={past} />}
        </>
      )}
    </main>
  );
}

type Item = Awaited<ReturnType<typeof listReservations>>[number];

function Ledger({ title, items, empty }: { title: string; items: Item[]; empty?: string }) {
  return (
    <section className="ledger" aria-label={title}>
      <h2 className="section-title">{title}</h2>
      {items.length === 0 ? (
        <p className="ledger-empty">{empty}</p>
      ) : (
        <ul className="ledger-list">
          {items.map((r) => {
            const count = nights(r.checkIn, r.checkOut);
            return (
            <li key={r.id}>
              <Link href={`/reservas/${r.id}`} className={`ledger-row ledger-${r.status}`}>
                <span className="ledger-dates">
                  {formatDate(r.checkIn)} – {formatDate(r.checkOut)}
                  <span className="ledger-nights">{count} {count === 1 ? "noche" : "noches"}</span>
                </span>
                <span className="ledger-guest">
                  {r.guestName}
                  <span className="ledger-property">{r.property.name}</span>
                </span>
                <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
