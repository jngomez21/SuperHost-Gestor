import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/application/messaging";
import { listProperties } from "@/application/properties";
import { requireHost } from "@/app/_lib/host";
import { formatTiming } from "@/app/_lib/format";
import { removeTemplateAction } from "../actions";
import { TemplateForm } from "../template-form";

export default async function EditTemplatePage({ params }: PageProps<"/mensajes/[id]">) {
  const host = await requireHost();
  const { id } = await params;
  const [template, properties] = await Promise.all([getTemplate(host.id, id), listProperties(host.id)]);
  if (!template) notFound();

  return (
    <main className="page">
      <p><Link href="/mensajes" className="back-link">Tus plantillas</Link></p>
      <h1 className="page-title">{template.name}</h1>
      <p className="page-lead">{formatTiming(template)}</p>
      <TemplateForm id={template.id} initial={template} places={properties} />

      <details className="danger">
        <summary className="danger-summary">Quitar plantilla</summary>
        <p className="section-lead">
          Las reservas nuevas ya no la programarán. En las ya registradas desaparecen los mensajes que
          no has enviado ni editado; los enviados y los editados se quedan con su texto.
        </p>
        <form action={removeTemplateAction.bind(null, template.id)}>
          <button type="submit" className="button button-danger">Sí, quitar plantilla</button>
        </form>
      </details>
    </main>
  );
}
