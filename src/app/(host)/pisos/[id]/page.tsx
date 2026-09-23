import { notFound } from "next/navigation";
import { getProperty } from "@/application/properties";
import { listTasks } from "@/application/housekeeping";
import { requireHost } from "@/app/_lib/host";
import { PropertyForm } from "../property-form";
import { TaskEditor } from "../task-editor";

export default async function EditPropertyPage({ params }: PageProps<"/pisos/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const property = await getProperty(host.id, id);
  if (!property) notFound();
  const tasks = await listTasks(host.id, property.id);

  return (
    <main className="panel">
      <h1 className="panel-title">{property.name}</h1>
      <p className="panel-lead">{property.address}</p>
      <PropertyForm id={property.id} initial={property} />
      <TaskEditor propertyId={property.id} tasks={tasks.map(({ id, label }) => ({ id, label }))} />
    </main>
  );
}
