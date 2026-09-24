import Link from "next/link";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { TemplateForm } from "../template-form";

export default async function NewTemplatePage() {
  const host = await requireHost();
  const properties = await listProperties(host.id);

  return (
    <main className="page">
      <p><Link href="/mensajes" className="back-link">Tus plantillas</Link></p>
      <h1 className="page-title">Nueva <span className="boxed">plantilla</span></h1>
      <p className="page-lead">
        Elige cuándo toca y escribe el mensaje una vez: cada reserva nueva lo programa con sus propios datos.
      </p>
      <TemplateForm id={null} places={properties} />
    </main>
  );
}
