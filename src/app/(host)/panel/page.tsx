import Link from "next/link";
import { listProperties } from "@/application/properties";
import { listReservations } from "@/application/reservations";
import { listPreparations } from "@/application/housekeeping";
import { listDueMessages } from "@/application/messaging";
import { requireHost } from "@/app/_lib/host";
import { dayLabel, dayTimeLabel, formatDate, formatLongDate, formatTime } from "@/app/_lib/format";
import { HandNote } from "@/app/_components/hand-note";
import { ArrivalIcon, DepartureIcon } from "@/app/_components/icons";
import { frontDesk } from "@/domain/reservation/front-desk";
import { pendingArrivals, type Preparation } from "@/domain/housekeeping/checklist";

function prepText(prep: Preparation | undefined) {
  if (!prep?.hasChecklist) return "Sin lista";
  return prep.ready ? "Listo" : `${prep.done} de ${prep.total}`;
}

function KeyPrep({ reservation, prep }: { reservation: { guestName: string } | null; prep: Preparation | undefined }) {
  if (!reservation) return null;
  return (
    <span className={`keycap-prep${prep?.ready ? " keycap-prep-ok" : ""}`}>
      {prep?.ready ? `Listo para ${reservation.guestName.split(" ")[0]}` : `Preparación: ${prepText(prep)}`}
    </span>
  );
}

export default async function PanelPage() {
  const host = await requireHost();
  const [properties, reservations, preps, due] = await Promise.all([
    listProperties(host.id),
    listReservations(host.id),
    listPreparations(host.id),
    listDueMessages(host.id),
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
  const [weekday, ...date] = formatLongDate(today).split(" ");

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{weekday} <span className="boxed">{date.join(" ")}</span></h1>
          {properties.length > 0 && (
            <dl className="stats">
              <div className="stat">
                <dt className="stat-label"><ArrivalIcon /> Llegan hoy</dt>
                <dd className="stat-number">{arrivals}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label"><DepartureIcon /> Salen hoy</dt>
                <dd className="stat-number">{departures}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">Pisos ocupados</dt>
                <dd className="stat-number">{occupied}<span className="stat-of">/{properties.length}</span></dd>
              </div>
              <div className="stat">
                <dt className="stat-label">Por preparar</dt>
                <dd className={`stat-number${toPrepare.length ? " stat-alert" : ""}`}>{toPrepare.length}</dd>
              </div>
            </dl>
          )}
        </div>
        {properties.length > 0 && <Link href="/reservas/nueva" className="button button-skew">Registrar reserva</Link>}
      </header>

      {due.length > 0 && (
        <section className="task" aria-labelledby="send-title">
          <h2 id="send-title" className="task-head">
            Por enviar
            <span>{due.length} {due.length === 1 ? "mensaje" : "mensajes"}</span>
          </h2>
          <div className="task-body">
            <p className="task-text">Cópialos, pégalos en el chat de Airbnb de cada huésped y márcalos como enviados.</p>
            <ul className="todo-list">
              {due.map((message) => (
                <li key={message.id}>
                  <Link href={`/reservas/${message.reservation.id}#mensaje-${message.id}`} className="todo-row">
                    <span className="todo-day">{dayTimeLabel(message.sendAt, today)}</span>
                    <span className="todo-guest">
                      {message.reservation.guestName}
                      <span className="todo-property">{message.property.name}</span>
                    </span>
                    <span className="todo-progress">{message.name}</span>
                    <span className="todo-cta">Ver texto</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {weekArrivals.length > 0 && (
        <section className="task" aria-labelledby="todo-title">
          <h2 id="todo-title" className="task-head">Por preparar esta semana</h2>
          <div className="task-body">
            {toPrepare.length === 0 ? (
              <p className="task-done">Todo listo para las llegadas de esta semana.</p>
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
                        <span className="todo-guest">
                          {r.guestName}
                          <span className="todo-property">{r.property.name}</span>
                        </span>
                        <span className="todo-progress">
                          {prep?.hasChecklist ? (
                            <>
                              <span className="meter" aria-hidden="true">
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
          </div>
        </section>
      )}

      {properties.length === 0 ? (
        <section className="section" aria-labelledby="empty-title">
          <h2 id="empty-title" className="section-title">Tu casillero está vacío</h2>
          <p className="section-lead">Da de alta tu primer piso y aquí verás cada día quién llega, quién está dentro y quién sale.</p>
          <ul className="keyboard keyboard-empty">
            <li className="keycap keycap-ghost" aria-hidden="true" />
            <li className="keyboard-cta">
              <HandNote arrow="left">¡Empieza por aquí!</HandNote>
              <Link href="/pisos/nuevo" className="button button-skew">Añadir tu primer piso</Link>
            </li>
          </ul>
        </section>
      ) : (
        <section className="section" aria-labelledby="rack-title">
          <div className="section-head">
            <h2 id="rack-title" className="section-title">Casillero</h2>
            <HandNote arrow="down">Tecla hundida: hay un huésped dentro</HandNote>
          </div>
          <ul className="keyboard">
            {rack.map(({ property, inHouse, arrivingToday, leftToday, next }) => (
              <li key={property.id}>
                {inHouse ? (
                  <Link href={`/reservas/${inHouse.id}`} className="keycap keycap-busy">
                    <span className="keycap-name">{property.name}</span>
                    <span className="chip chip-in_house">Ocupado</span>
                    <span className="keycap-detail">Tiene la llave <strong>{inHouse.guestName}</strong></span>
                    <span className="keycap-detail">
                      {inHouse.checkOut === today
                        ? `Sale hoy antes de las ${formatTime(property.checkOutTime)}`
                        : `Sale el ${formatDate(inHouse.checkOut)}`}
                    </span>
                    {arrivingToday && (
                      <span className="keycap-turnover">
                        Después llega {arrivingToday.guestName}, desde las {formatTime(property.checkInTime)}.
                        Preparación: {prepText(preps.get(arrivingToday.id))}
                      </span>
                    )}
                  </Link>
                ) : (
                  <Link
                    href={arrivingToday ? `/reservas/${arrivingToday.id}` : `/pisos/${property.id}`}
                    className={`keycap ${arrivingToday ? "keycap-arrival" : "keycap-free"}`}
                  >
                    <span className="keycap-name">{property.name}</span>
                    <span className={`chip ${arrivingToday ? "chip-arrival" : "chip-free"}`}>
                      {arrivingToday ? "Llega hoy" : "Libre"}
                    </span>
                    {arrivingToday && (
                      <span className="keycap-detail">
                        {arrivingToday.guestName}, desde las {formatTime(property.checkInTime)}
                      </span>
                    )}
                    {leftToday && <span className="keycap-detail">{leftToday.guestName} salió hoy</span>}
                    {!arrivingToday && (
                      <span className="keycap-detail">
                        {next ? `Próxima llegada: ${formatDate(next.checkIn)}` : "Sin reservas próximas"}
                      </span>
                    )}
                    <KeyPrep reservation={arrivingToday ?? next} prep={preps.get((arrivingToday ?? next)?.id ?? "")} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {properties.length > 0 && (
        <section className="section" aria-labelledby="agenda-title">
          <h2 id="agenda-title" className="section-title">Próximos 7 días</h2>
          {agenda.length === 0 ? (
            <p className="section-lead">Sin llegadas ni salidas en los próximos 7 días.</p>
          ) : (
            <ol className="days">
              {agenda.map((day) => (
                <li key={day.date} className={`day${day.date === today ? " day-today" : ""}`}>
                  <h3 className="day-title">{dayLabel(day.date, today)}</h3>
                  <ul className="moves">
                    {day.movements.map(({ kind, reservation }) => {
                      const done = kind === "arrival" ? reservation.status !== "upcoming" : reservation.status === "finished";
                      const label = kind === "arrival" ? (done ? "Llegó" : "Llega") : done ? "Salió" : "Sale";
                      const prep = preps.get(reservation.id);
                      return (
                        <li key={`${kind}-${reservation.id}`}>
                          <Link href={`/reservas/${reservation.id}`} className={`move move-${kind}${done ? " move-done" : ""}`}>
                            <span className="move-kind">
                              {kind === "arrival" ? <ArrivalIcon /> : <DepartureIcon />}
                              {label}
                            </span>
                            <span className="move-guest">
                              {reservation.guestName}
                              <span className="move-property">
                                {reservation.property.name}
                                {kind === "arrival" && !done && (
                                  <span className={`prep-chip${prep?.ready ? " prep-chip-ok" : ""}`}>{prepText(prep)}</span>
                                )}
                              </span>
                            </span>
                            <span className="move-time">
                              {kind === "arrival"
                                ? `desde las ${formatTime(reservation.property.checkInTime)}`
                                : `antes de las ${formatTime(reservation.property.checkOutTime)}`}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <footer className="page-foot">
        <Link href="/estado" className="quiet-link">Estado del sistema</Link>
      </footer>
    </main>
  );
}
