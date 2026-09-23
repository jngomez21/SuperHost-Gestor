import { notFound } from "next/navigation";
import { getProperty } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { PropertyForm } from "../property-form";

export default async function EditPropertyPage({ params }: PageProps<"/pisos/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const property = await getProperty(host.id, id);
  if (!property) notFound();

  return (
    <main className="panel">
      <h1 className="panel-title">{property.name}</h1>
      <p className="panel-lead">{property.address}</p>
      <PropertyForm id={property.id} initial={property} />
    </main>
  );
}
