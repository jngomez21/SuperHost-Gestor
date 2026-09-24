import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuide } from "@/application/guide";
import { requireHost } from "@/app/_lib/host";
import { addDays, todayInColombia } from "@/domain/reservation/status";
import { GuestGuide } from "../../estancia/guest-guide";

export const metadata: Metadata = { title: "Vista previa de la guía", robots: { index: false, follow: false } };

// La guía tal como la ve un huésped, con una reserva de ejemplo. Solo para el host.
export default async function GuidePreviewPage({ params }: PageProps<"/vista-previa/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const guide = await getGuide(host.id, id);
  if (!guide) notFound();

  const today = todayInColombia(new Date());
  const stay = { firstName: "Laura", guestCount: 2, checkIn: addDays(today, 3), checkOut: addDays(today, 6) };

  return (
    <>
      <p className="preview-banner">
        Vista previa con una huésped de ejemplo. <Link href={`/guia/${id}`}>Volver a editar la guía</Link>
      </p>
      <GuestGuide stay={stay} guide={guide} />
    </>
  );
}
