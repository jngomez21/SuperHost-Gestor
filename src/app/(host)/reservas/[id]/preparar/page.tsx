import Link from "next/link";
import { notFound } from "next/navigation";
import { getPreparation } from "@/application/housekeeping";
import { requireHost } from "@/app/_lib/host";
import { formatDate, formatTime } from "@/app/_lib/format";
import { PrepList } from "./prep-list";

export default async function PreparePage({ params }: PageProps<"/reservas/[id]/preparar">) {
  const host = await requireHost();
  const { id } = await params;
  const prep = await getPreparation(host.id, id);
  if (!prep) notFound();

  const { reservation, tasks } = prep;
  const cancelled = reservation.status === "cancelled";

  return (
    <main className="panel prep">
      <p><Link href={`/reservas/${reservation.id}`} className="back-link">Ficha de {reservation.guestName}</Link></p>
      <h1 className="panel-title">Preparar {reservation.property.name}</h1>
      {cancelled && (
        <p className="form-error">Esta reserva está cancelada: la lista se muestra solo para consulta.</p>
      )}
      <PrepList
        reservationId={reservation.id}
        guestFirstName={reservation.guestName.split(" ")[0]}
        arrival={`Para ${reservation.guestName}, llega el ${formatDate(reservation.checkIn)} desde las ${formatTime(reservation.property.checkInTime)}`}
        tasks={tasks.map((t) => ({ id: t.id, label: t.label, doneAt: t.doneAt?.toISOString() ?? null }))}
        readOnly={cancelled}
      />
    </main>
  );
}
