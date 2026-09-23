import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { ReservationForm } from "../reservation-form";

export default async function NewReservationPage({ searchParams }: PageProps<"/reservas/nueva">) {
  const host = await requireHost();
  const properties = await listProperties(host.id);
  const { piso } = await searchParams;

  return (
    <main className="page">
      <p><Link href="/reservas" className="back-link">Libro de huéspedes</Link></p>
      <h1 className="page-title">Registrar <span className="boxed">reserva</span></h1>
      {properties.length === 0 ? (
        <>
          <p className="page-lead">Para registrar una reserva primero necesitas un piso.</p>
          <p className="form-actions section">
            <Link href="/pisos/nuevo" className="button button-skew">Añadir tu primer piso</Link>
          </p>
        </>
      ) : (
        <>
          <p className="page-lead">Copia los datos de la reserva de Airbnb. Las fechas no pueden cruzarse con otra reserva del mismo piso.</p>
          <ReservationForm
            properties={properties.map(({ id, name, checkInTime, checkOutTime }) => ({ id, name, checkInTime, checkOutTime }))}
            preselected={typeof piso === "string" ? piso : undefined}
          />
        </>
      )}
    </main>
  );
}
