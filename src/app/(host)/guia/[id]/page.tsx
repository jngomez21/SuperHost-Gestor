import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide } from "@/application/guide";
import { requireHost } from "@/app/_lib/host";
import { HandNote } from "@/app/_components/hand-note";
import { formatLocation, GUIDE_TEXTS } from "@/domain/property/guide";
import { GuideForm } from "../guide-form";
import { PhotoManager } from "../photo-manager";
import { PlacesEditor } from "../places-editor";

export default async function EditGuidePage({ params }: PageProps<"/guia/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const guide = await getGuide(host.id, id);
  if (!guide) notFound();
  const { property, photos, places } = guide;

  const initial: Record<string, string> = Object.fromEntries(GUIDE_TEXTS.map((field) => [field, property[field] ?? ""]));
  initial.location = formatLocation(
    property.latitude !== null && property.longitude !== null ? { lat: property.latitude, lng: property.longitude } : null
  );

  return (
    <main className="page">
      <p><Link href="/guia" className="back-link">La guía del huésped</Link></p>
      <header className="page-head">
        <div>
          <h1 className="page-title">{property.name}</h1>
          <p className="page-lead">Lo que guardes aquí lo ven todos los huéspedes de este piso, cada uno con su nombre y sus fechas.</p>
        </div>
        <div className="guide-preview-cta">
          <HandNote arrow="down">Así lo ven</HandNote>
          <Link href={`/vista-previa/${property.id}`} className="button button-quiet" target="_blank">Ver como huésped</Link>
        </div>
      </header>

      <PhotoManager propertyId={property.id} photos={photos} />

      <section className="section" aria-labelledby="guide-title">
        <h2 id="guide-title" className="section-title">La información</h2>
        <p className="section-lead">Las secciones vacías no salen en la guía.</p>
        <GuideForm propertyId={property.id} initial={initial} />
      </section>

      <PlacesEditor propertyId={property.id} places={places} />
    </main>
  );
}
