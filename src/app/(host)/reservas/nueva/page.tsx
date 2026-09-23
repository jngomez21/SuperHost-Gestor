import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { ReservationForm } from "../reservation-form";

export default async function NewReservationPage({ searchParams }: PageProps<"/reservas/nueva">) {
  const host = await requireHost();
  const properties = await listProperties(host.id);
  const { piso } = await searchParams;

  return (
    <main className="panel">
      <h1 className="panel-title">Registrar reserva</h1>
      {properties.length === 0 ? (
        <>
          <p className="panel-lead">Para registrar una reserva primero necesitas un piso.</p>
          <p className="form-actions">
            <Link href="/pisos/nuevo" className="button">Añadir tu primer piso</Link>
          </p>
        </>
      ) : (
        <>
          <p className="panel-lead">Copia los datos de la reserva de Airbnb. Las fechas no pueden cruzarse con otra reserva del mismo piso.</p>
          <ReservationForm
            properties={properties.map(({ id, name, checkInTime, checkOutTime }) => ({ id, name, checkInTime, checkOutTime }))}
            preselected={typeof piso === "string" ? piso : undefined}
          />
        </>
      )}
    </main>
  );
}
