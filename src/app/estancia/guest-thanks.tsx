import { HandNote } from "@/app/_components/hand-note";
import { GuestTopbar } from "./guest-guide";

// Airbnb abre "Viajes"; en el móvil, el enlace abre la app si está instalada.
const AIRBNB_TRIPS = "https://www.airbnb.com/trips";

// Tras la salida (ADR-007): solo gracias y la invitación a la reseña, sin datos del piso.
export function GuestThanks({ firstName, propertyName, coverUrl }: { firstName: string; propertyName: string; coverUrl: string | null }) {
  return (
    <>
      <GuestTopbar name={propertyName} />
      <main className="entry guest-thanks">
        <p className="thanks-stars" role="img" aria-label="Cinco estrellas">
          {Array.from({ length: 5 }, (_, i) => <span key={i} style={{ animationDelay: `${0.25 + i * 0.12}s` }}>★</span>)}
        </p>
        <h1 className="entry-title">¡Gracias por quedarte, <span className="boxed">{firstName}</span>!</h1>
        <p className="entry-lead">
          Espero que hayas disfrutado {propertyName}. Soy anfitrión nuevo y cada reseña me ayuda muchísimo: son dos minutos desde la app de Airbnb.
        </p>

        {coverUrl && (
          <figure className="polaroid">
            {/* eslint-disable-next-line @next/next/no-img-element -- foto ya comprimida, servida por la CDN de Blob */}
            <img src={coverUrl} alt={propertyName} />
            <figcaption className="hand">{propertyName}</figcaption>
          </figure>
        )}

        <div className="entry-body">
          <ol className="roadmap thanks-steps">
            <li>Abre la <strong>app de Airbnb</strong></li>
            <li>Toca <strong>Viajes</strong></li>
            <li>Elige tu estancia en <strong>{propertyName}</strong></li>
            <li>Toca <strong>Escribir una reseña</strong> y cuéntalo todo</li>
          </ol>
          <a className="button button-skew" href={AIRBNB_TRIPS} target="_blank" rel="noreferrer">Abrir Airbnb y dejar mi reseña</a>
          <HandNote>¡Vuelve cuando quieras!</HandNote>
        </div>
      </main>
    </>
  );
}
