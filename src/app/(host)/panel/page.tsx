import Link from "next/link";
import { listProperties } from "@/application/properties";
import { listReservations } from "@/application/reservations";
import { listPreparations } from "@/application/housekeeping";
import { requireHost } from "@/app/_lib/host";
import { dayLabel, formatDate, formatLongDate, formatTime } from "@/app/_lib/format";
import { frontDesk } from "@/domain/reservation/front-desk";
import { pendingArrivals, type Preparation } from "@/domain/housekeeping/checklist";

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function prepText(prep: Preparation | undefined) {
  if (!prep?.hasChecklist) return "Sin lista";
  return prep.ready ? "Listo" : `${prep.done} de ${prep.total}`;
}

function SlotPrep({ reservation, prep }: { reservation: { guestName: string } | null; prep: Preparation | undefined }) {
  if (!reservation) return null;
  return (
    <span className="slot-prep">
      {prep?.ready ? `Listo para ${reservation.guestName.split(" ")[0]}` : `Preparación: ${prepText(prep)}`}
    </span>
  );
}

export default async function PanelPage() {
  const host = await requireHost();
  const [properties, reservations, preps] = await Promise.all([
    listProperties(host.id),
    listReservations(host.id),
    listPreparations(host.id),
  ]);
  const { today, rack, agenda } = frontDesk(properties, reservations, new Date());
  const weekArrivals = agenda.flatMap((day) =>
    day.movements
      .filter((m) => m.kind === "arrival" && m.reservation.status === "upcoming")
      .map((m) => ({ ...m.reservation, date: day.date }))
  );
  const toPrepare = pendingArrivals(weekArrivals, preps);

  const todayMoves = agenda.find((d) => d.date === today)?.movements ?? [];
  const arrivals = todayMoves.filter((m) => m.kind === "arrival").length;
  const departures = todayMoves.filter((m) => m.kind === "departure").length;
  const occupied = rack.filter((slot) => slot.inHouse).length;

  const summary = [
    arrivals === 0 ? "Hoy no llega nadie" : `Hoy ${plural(arrivals, "llega 1 huésped", `llegan ${arrivals} huéspedes`)}`,
    departures === 0 ? "y no sale nadie." : `y ${plural(departures, "sale 1", `salen ${departures}`)}.`,
    properties.length === 1
      ? `Tu piso está ${occupied ? "ocupado" : "libre"}.`
      : occupied === 0
        ? `Ninguno de tus ${properties.length} pisos está ocupado.`
        : `${occupied} de tus ${properties.length} pisos ${plural(occupied, "está ocupado", "están ocupados")}.`,
    toPrepare.length > 0
      ? plural(toPrepare.length, "1 llegada de esta semana aún no está preparada.", `${toPrepare.length} llegadas de esta semana aún no están preparadas.`)
      : "",
  ].filter(Boolean).join(" ");

  return (
    <main className="panel">
      <header className="panel-head">
        <div>
          <h1 className="panel-title">{formatLongDate(today)}</h1>
          {properties.length > 0 && <p className="panel-lead">{summary}</p>}
        </div>
        {properties.length > 0 && <Link href="/reservas/nueva" className="button">Registrar reserva</Link>}
      </header>

      {weekArrivals.length > 0 && (
        <section className="todo" aria-labelledby="todo-title">
          <h2 id="todo-title" className="section-title">Por preparar</h2>
          {toPrepare.length === 0 ? (
            <p className="todo-done">Todo listo para las llegadas de esta semana.</p>
          ) : (
            <ul className="todo-list">
              {toPrepare.map((r) => {
                const prep = preps.get(r.id);
                return (
                  <li key={r.id}>
                    <Link
                      href={prep?.hasChecklist ? `/reservas/${r.id}/preparar` : `/pisos/${r.propertyId}`}
                      className="todo-row"
                    >
                      <span className="todo-day">{dayLabel(r.date, today)}</span>
                      <span className="ledger-guest">
                        {r.guestName}
                        <span className="ledger-property">{r.property.name}</span>
                      </span>
                      <span className="todo-progress">
                        {prep?.hasChecklist ? (
                          <>
                            <span className="todo-bar" aria-hidden="true">
                              <span style={{ width: `${(prep.done / prep.total) * 100}%` }} />
                            </span>
                            {prep.done} de {prep.total}
                          </>
                        ) : (
                          <span className="todo-missing">Sin lista</span>
                        )}
                      </span>
                      <span className="todo-cta">{prep?.hasChecklist ? "Preparar" : "Crear lista"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {properties.length === 0 ? (
        <section className="board board-empty" aria-labelledby="empty-title">
          <ul className="board-rail">
            <li className="slot">
              <div className="slot-hook" aria-hidden="true" />
              <div className="tag-ghost" aria-hidden="true" />
            </li>
          </ul>
          <div className="empty-copy">
            <h2 id="empty-title" className="section-title">Tu casillero está vacío</h2>
            <p className="empty-text">Da de alta tu primer piso y aquí verás cada día quién llega, quién está dentro y quién sale.</p>
            <Link href="/pisos/nuevo" className="button">Añadir tu primer piso</Link>
          </div>
        </section>
      ) : (
        <section className="board" aria-labelledby="rack-title">
          <h2 id="rack-title" className="section-title">Casillero</h2>
          <p className="board-hint">Si la llave cuelga, el piso está libre. Si falta, hay un huésped dentro.</p>
          <ul className="board-rail">
            {rack.map(({ property, inHouse, arrivingToday, leftToday, next }) => (
              <li key={property.id} className="slot">
                <div className="slot-hook" aria-hidden="true" />
                {inHouse ? (
                  <Link href={`/reservas/${inHouse.id}`} className="tag-ghost tag-out">
                    <span className="slot-name">{property.name}</span>
                    <span className="slot-detail">Tiene la llave <strong>{inHouse.guestName}</strong></span>
                    <span className="slot-detail">
                      {inHouse.checkOut === today
                        ? `Sale hoy antes de las ${formatTime(property.checkOutTime)}`
                        : `Sale el ${formatDate(inHouse.checkOut)}`}
                    </span>
                    {arrivingToday && (
                      <span className="slot-detail slot-turnover">
                        Después llega {arrivingToday.guestName}, desde las {formatTime(property.checkInTime)}.
                        Preparación: {prepText(preps.get(arrivingToday.id))}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href={arrivingToday ? `/reservas/${arrivingToday.id}` : `/pisos/${property.id}`}
                    className="tag tag-link"
                  >
                    <span className="slot-name">{property.name}</span>
                    <span className={`stamp ${arrivingToday ? "stamp-arrival" : "stamp-ok"}`}>
                      {arrivingToday ? "Llega hoy" : "Libre"}
                    </span>
                    {arrivingToday && (
                      <span className="slot-detail">
                        {arrivingToday.guestName}, desde las {formatTime(property.checkInTime)}
                      </span>
                    )}
                    {leftToday && <span className="slot-detail">{leftToday.guestName} salió hoy</span>}
                    {!arrivingToday && (
                      <span className="slot-detail">
                        {next ? `Próxima llegada: ${formatDate(next.checkIn)}` : "Sin reservas próximas"}
                      </span>
                    )}
                    <SlotPrep reservation={arrivingToday ?? next} prep={preps.get((arrivingToday ?? next)?.id ?? "")} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {properties.length > 0 && (
        <section className="agenda" aria-labelledby="agenda-title">
          <h2 id="agenda-title" className="section-title">Próximos 7 días</h2>
          {agenda.length === 0 ? (
            <p className="ledger-empty">Sin llegadas ni salidas en los próximos 7 días.</p>
          ) : (
            agenda.map((day) => (
              <div key={day.date} className="agenda-day">
                <h3 className="agenda-date">{dayLabel(day.date, today)}</h3>
                <ul className="ledger-list">
                  {day.movements.map(({ kind, reservation }) => {
                    const done = kind === "arrival" ? reservation.status !== "upcoming" : reservation.status === "finished";
                    const label = kind === "arrival" ? (done ? "Llegó" : "Llega") : done ? "Salió" : "Sale";
                    return (
                    <li key={`${kind}-${reservation.id}`}>
                      <Link href={`/reservas/${reservation.id}`} className={`agenda-row${done ? " agenda-done" : ""}`}>
                        <span className={`badge ${kind === "arrival" ? "badge-upcoming" : "badge-finished"}`}>
                          {label}
                        </span>
                        <span className="ledger-guest">
                          {reservation.guestName}
                          <span className="ledger-property">
                            {reservation.property.name}
                            {kind === "arrival" && !done && (
                              <span className={`prep-chip${preps.get(reservation.id)?.ready ? " prep-chip-ok" : ""}`}>
                                {prepText(preps.get(reservation.id))}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="agenda-time">
                          {kind === "arrival"
                            ? `desde las ${formatTime(reservation.property.checkInTime)}`
                            : `antes de las ${formatTime(reservation.property.checkOutTime)}`}
                        </span>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </section>
      )}

      <footer className="panel-foot">
        <Link href="/estado" className="back-link-plain">Estado del sistema</Link>
      </footer>
    </main>
  );
}
