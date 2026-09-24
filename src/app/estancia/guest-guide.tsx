import type { ReactNode } from "react";
import { HandNote } from "@/app/_components/hand-note";
import { ArrivalIcon, DepartureIcon } from "@/app/_components/icons";
import { Preferences } from "@/app/_components/preferences";
import { Wordmark } from "@/app/_components/wordmark";
import { formatDate, formatTime } from "@/app/_lib/format";
import type { Guide } from "@/application/guide";
import { directionsUrl, googleMapsUrl, lines, mapEmbedUrl, PLACE_CATEGORIES } from "@/domain/property/guide";
import { nights } from "@/domain/reservation/status";
import { CopyButton } from "./copy-button";

export type GuestStay = { firstName: string; guestCount: number; checkIn: string; checkOut: string };

// Cabecera colgante de la guía: el piso como logo, y el tema claro/oscuro del huésped.
export function GuestTopbar({ name }: { name: string }) {
  return (
    <div className="topbar-wrap">
      <header className="topbar guest-topbar">
        <Wordmark text={name} />
        <div className="topbar-tools"><Preferences /></div>
      </header>
    </div>
  );
}

function Section({ id, title, lead, children }: { id: string; title: ReactNode; lead?: string; children: ReactNode }) {
  return (
    <section id={id} className="section guest-section" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="section-title">{title}</h2>
      {lead && <p className="section-lead">{lead}</p>}
      {children}
    </section>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="guest-block">
      <h3 className="guest-block-title">{title}</h3>
      {children}
    </div>
  );
}

const Text = ({ value }: { value: string }) => <p className="guest-text">{value}</p>;

// La guía completa del piso para un huésped (ADR-007). Solo se pintan las secciones con datos.
export function GuestGuide({ stay, guide }: { stay: GuestStay; guide: Guide }) {
  const { property: p, photos, places } = guide;
  const location = p.latitude !== null && p.longitude !== null ? { lat: p.latitude, lng: p.longitude } : null;
  const count = nights(stay.checkIn, stay.checkOut);
  const [rules, amenities, checkout] = [lines(p.houseRules), lines(p.amenities), lines(p.checkoutList)];
  const hasHouse = rules.length || p.houseGuide || amenities.length || p.trashInfo;
  const groups = PLACE_CATEGORIES.map((category) => [category, places.filter((pl) => pl.category === category)] as const)
    .filter(([, list]) => list.length);

  const keys = [
    (p.wifiName || p.wifiPassword || p.tvInfo) && ["internet", "Wifi y TV"],
    ["llegar", "Llegar"],
    hasHouse && ["casa", "La casa"],
    places.length && ["cerca", "Cerca"],
    ["salida", "Salida"],
    ["ayuda", "Ayuda"],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <GuestTopbar name={p.name} />
      <main className="page guest">
        <section className="guest-hero">
          <div>
            <h1 className="page-title">Hola, <span className="boxed">{stay.firstName}</span></h1>
            <p className="page-lead">Bienvenido a {p.name}. Aquí tienes todo lo de tu estancia, a mano hasta que te vayas.</p>
            <dl className="stats guest-stats">
              <div className="stat">
                <dt className="stat-label"><ArrivalIcon /> Desde las {formatTime(p.checkInTime)}</dt>
                <dd className="stat-number guest-stat-date">{formatDate(stay.checkIn)}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label"><DepartureIcon /> Antes de las {formatTime(p.checkOutTime)}</dt>
                <dd className="stat-number guest-stat-date">{formatDate(stay.checkOut)}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">{count === 1 ? "Noche" : "Noches"}</dt>
                <dd className="stat-number">{count}</dd>
              </div>
              <div className="stat">
                <dt className="stat-label">{stay.guestCount === 1 ? "Huésped" : "Huéspedes"}</dt>
                <dd className="stat-number">{stay.guestCount}</dd>
              </div>
            </dl>
          </div>
          {photos[0] && (
            <figure className="guest-cover">
              {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya comprimidas, servidas por la CDN de Blob */}
              <img src={photos[0].url} alt={`${p.name}, foto de portada`} />
            </figure>
          )}
        </section>

        <nav className="guest-keys" aria-label="Secciones de la guía">
          {keys.map(([id, label]) => <a key={id} href={`#${id}`} className="navkey">{label}</a>)}
        </nav>

        {photos.length > 1 && (
          <Section id="fotos" title="El apartamento">
            <HandNote arrow="down" className="guest-note">Desliza para ver más</HandNote>
            <ul className="guest-gallery" aria-label="Fotos del apartamento">
              {photos.map((photo, i) => (
                <li key={photo.id}>
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element -- fotos ya comprimidas, servidas por la CDN de Blob */}
                    <img src={photo.url} alt={`${p.name}, foto ${i + 1} de ${photos.length}`} loading="lazy" />
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(p.wifiName || p.wifiPassword || p.tvInfo) && (
          <Section id="internet" title="Wifi y TV">
            {(p.wifiName || p.wifiPassword) && (
              <div className="guest-wifi">
                {p.wifiName && <p><span className="guest-label">Red</span><strong className="guest-secret">{p.wifiName}</strong></p>}
                {p.wifiPassword && (
                  <p>
                    <span className="guest-label">Clave</span>
                    <strong className="guest-secret">{p.wifiPassword}</strong>
                    <CopyButton value={p.wifiPassword} label="Copiar clave" />
                  </p>
                )}
              </div>
            )}
            {p.tvInfo && <Block title="Televisión"><Text value={p.tvInfo} /></Block>}
          </Section>
        )}

        <Section id="llegar" title="Cómo llegar" lead={p.address}>
          {location && (
            <div className="guest-map">
              <iframe title={`Mapa: ubicación de ${p.name}`} src={mapEmbedUrl(location)} loading="lazy" />
            </div>
          )}
          {location && (
            <p className="guest-actions">
              <a className="button button-skew" href={googleMapsUrl(location)} target="_blank" rel="noreferrer">Abrir en Google Maps</a>
            </p>
          )}
          <div className="guest-blocks">
            {p.arrivalInfo && <Block title="Al llegar"><Text value={p.arrivalInfo} /></Block>}
            {p.accessInstructions && <Block title="Cómo entrar"><Text value={p.accessInstructions} /></Block>}
          </div>
        </Section>

        {hasHouse && (
          <Section id="casa" title="La casa">
            <div className="guest-blocks">
              {rules.length > 0 && (
                <Block title="Normas">
                  <ol className="roadmap guest-list">{rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
                </Block>
              )}
              {p.houseGuide && <Block title="Cómo funciona"><Text value={p.houseGuide} /></Block>}
              {amenities.length > 0 && (
                <Block title="Qué hay en el apartamento">
                  <ul className="guest-tags">{amenities.map((item) => <li key={item} className="chip">{item}</li>)}</ul>
                </Block>
              )}
              {p.trashInfo && <Block title="Basura y reciclaje"><Text value={p.trashInfo} /></Block>}
            </div>
          </Section>
        )}

        {places.length > 0 && (
          <Section id="cerca" title="Cerca de aquí" lead="Distancias en línea recta desde el apartamento.">
            {groups.map(([category, list]) => (
              <div key={category} className="guest-group">
                <h3 className="guest-block-title">{category}</h3>
                <ul className="guest-places">
                  {list.map((place) => (
                    <li key={place.id} className="guest-place">
                      <p className="guest-place-name">{place.name}</p>
                      {place.distance && <p className="guest-place-distance">{place.distance}</p>}
                      {place.note && <p className="guest-place-note">{place.note}</p>}
                      <a className="button button-quiet button-small" href={directionsUrl(place.mapsQuery ?? place.name, location)} target="_blank" rel="noreferrer">
                        Cómo llegar
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Section>
        )}

        <section id="salida" className="task guest-section" aria-labelledby="salida-title">
          <h2 id="salida-title" className="task-head">
            Antes de irte
            <span>{formatDate(stay.checkOut)}, antes de las {formatTime(p.checkOutTime)}</span>
          </h2>
          <div className="task-body">
            {checkout.length > 0 ? (
              <ul className="sheet-list">
                {checkout.map((item) => (
                  <li key={item} className="sheet-row guest-check"><span className="sheet-box" aria-hidden="true" /><span className="sheet-label">{item}</span></li>
                ))}
              </ul>
            ) : (
              <p className="task-text">Deja las llaves como las encontraste. ¡Gracias!</p>
            )}
          </div>
        </section>

        <Section id="ayuda" title="Ayuda">
          <div className="guest-blocks">
            {p.transportInfo && <Block title="Moverse por la ciudad"><Text value={p.transportInfo} /></Block>}
            <Block title="Emergencias">
              {p.emergencyInfo && <Text value={p.emergencyInfo} />}
              <p className="guest-actions"><a className="button button-danger button-small" href="tel:123">Llamar al 123</a></p>
            </Block>
          </div>
          <HandNote className="guest-sign">¿Algo más? Escríbeme por el chat de Airbnb.</HandNote>
        </Section>
      </main>
    </>
  );
}
