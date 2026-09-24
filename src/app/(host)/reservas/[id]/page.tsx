import Link from "next/link";
import { notFound } from "next/navigation";
import { getPreparation } from "@/application/housekeeping";
import { listMessages } from "@/application/messaging";
import { requireHost } from "@/app/_lib/host";
import { formatDate, formatDateTime, formatTime, STATUS_LABEL } from "@/app/_lib/format";
import { nights } from "@/domain/reservation/status";
import { cancelReservationAction } from "../actions";
import { MessageList } from "./message-list";
import { NoteForm } from "./note-form";

export default async function ReservationPage({ params }: PageProps<"/reservas/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const [prep, messages] = await Promise.all([getPreparation(host.id, id), listMessages(host.id, id)]);
  if (!prep) notFound();

  const { reservation, progress } = prep;
  const { property, status } = reservation;
  const count = nights(reservation.checkIn, reservation.checkOut);
  const cancellable = status === "upcoming" || status === "in_house";

  return (
    <main className="page">
      <p><Link href="/reservas" className="back-link">Libro de huéspedes</Link></p>

      <article className="card" aria-labelledby="guest-name">
        <header className="card-head">
          <div>
            <h1 id="guest-name" className="card-title">{reservation.guestName}</h1>
            <p className="card-lead">
              <Link href={`/pisos/${property.id}`}>{property.name}</Link>, {property.address}
            </p>
          </div>
          <span className={`chip chip-large chip-${status}`}>{STATUS_LABEL[status]}</span>
        </header>

        <dl className="card-stay">
          <div>
            <dt>Llegada</dt>
            <dd>{formatDate(reservation.checkIn)}</dd>
            <dd className="card-sub">desde las {formatTime(property.checkInTime)}</dd>
          </div>
          <div>
            <dt>Salida</dt>
            <dd>{formatDate(reservation.checkOut)}</dd>
            <dd className="card-sub">antes de las {formatTime(property.checkOutTime)}</dd>
          </div>
          <div>
            <dt>Estancia</dt>
            <dd>{count} {count === 1 ? "noche" : "noches"}</dd>
            <dd className="card-sub">{reservation.guestCount} {reservation.guestCount === 1 ? "huésped" : "huéspedes"}</dd>
          </div>
        </dl>

        <dl className="card-contact">
          <div>
            <dt>Email</dt>
            <dd>
              {reservation.guestEmail
                ? <a href={`mailto:${reservation.guestEmail}`}>{reservation.guestEmail}</a>
                : <span className="card-sub">Sin email</span>}
            </dd>
          </div>
          <div>
            <dt>Teléfono</dt>
            <dd>
              {reservation.guestPhone
                ? <a href={`tel:${reservation.guestPhone.replace(/\s/g, "")}`}>{reservation.guestPhone}</a>
                : <span className="card-sub">Sin teléfono</span>}
            </dd>
          </div>
        </dl>
      </article>

      {status !== "cancelled" && (
        <section className="task" aria-labelledby="prep-title">
          <h2 id="prep-title" className="task-head">
            Preparación del piso
            {progress.hasChecklist && <span>{progress.done} de {progress.total}</span>}
          </h2>
          <div className="task-body">
            <p className="task-text">
              {!progress.hasChecklist
                ? "Este piso no tiene lista de preparación. Sin lista, la llegada no puede darse por preparada."
                : progress.ready
                  ? "Todo listo: el piso está preparado para esta llegada."
                  : "Quedan tareas por hacer antes de que llegue el huésped."}
            </p>
            <div className="task-actions">
              {progress.hasChecklist ? (
                <Link href={`/reservas/${reservation.id}/preparar`} className="button">
                  {status === "upcoming" ? "Preparar la llegada" : "Ver la preparación"}
                </Link>
              ) : (
                <Link href={`/pisos/${reservation.propertyId}`} className="button">Crear lista</Link>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="log" aria-labelledby="messages-title">
        <h2 id="messages-title" className="section-title">Mensajes</h2>
        {messages.length === 0 ? (
          <p className="section-lead">
            Esta reserva no tiene mensajes. Las reservas nuevas programan los de{" "}
            <Link href="/mensajes">tus plantillas</Link> al registrarse.
          </p>
        ) : (
          <>
            <p className="section-lead">Cuando toca uno, cópialo, pégalo en el chat de Airbnb y márcalo como enviado.</p>
            <MessageList
              reservationId={reservation.id}
              propertyId={property.id}
              messages={messages.map(({ id, name, sendAt, sentAt, status, text, missing, edited }) => ({
                id, name, sendAt, sentAt, status, text, missing, edited,
              }))}
            />
          </>
        )}
      </section>

      <section className="log" aria-labelledby="log-title">
        <h2 id="log-title" className="section-title">Bitácora</h2>
        <p className="section-lead">Lo que pase con esta estancia: peticiones, incidencias, acuerdos con el huésped.</p>
        <NoteForm reservationId={reservation.id} />
        {reservation.notes.length === 0 ? (
          <p className="section-lead">Todavía no hay notas.</p>
        ) : (
          <ol className="roadmap">
            {reservation.notes.map((note) => (
              <li key={note.id} className="log-entry">
                <time dateTime={note.createdAt.toISOString()} className="log-time">{formatDateTime(note.createdAt)}</time>
                <p className="log-body">{note.body}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      {cancellable && (
        <details className="danger">
          <summary className="danger-summary">Cancelar reserva</summary>
          <p className="section-lead">
            La reserva dejará de aparecer en tus llegadas y liberará las fechas del piso. Se queda en el
            historial con sus notas. Esto no cancela nada en Airbnb.
          </p>
          <form action={cancelReservationAction.bind(null, reservation.id)}>
            <button type="submit" className="button button-danger">Sí, cancelar reserva</button>
          </form>
        </details>
      )}
    </main>
  );
}
