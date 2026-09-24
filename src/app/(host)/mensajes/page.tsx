import Link from "next/link";
import { listTemplates } from "@/application/messaging";
import { requireHost } from "@/app/_lib/host";
import { formatTiming } from "@/app/_lib/format";
import { SubmitButton } from "@/app/_components/submit-button";
import { createStandardTemplatesAction } from "./actions";

export default async function TemplatesPage() {
  const host = await requireHost();
  const templates = await listTemplates(host.id);

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Tus <span className="boxed">plantillas</span></h1>
          <p className="page-lead">
            Cada reserva nueva programa estos mensajes. Cuando toca uno, te avisamos con el texto
            listo para pegar en el chat de Airbnb.
          </p>
        </div>
        {templates.length > 0 && <Link href="/mensajes/nueva" className="button button-skew">Añadir plantilla</Link>}
      </header>

      {templates.length === 0 ? (
        <section className="task" aria-labelledby="start-title">
          <h2 id="start-title" className="task-head">Empieza con las cuatro de siempre</h2>
          <div className="task-body">
            <p className="task-text">
              Bienvenida al registrar la reserva, instrucciones de llegada el día antes, recordatorio de
              salida la víspera y despedida con petición de reseña. Después las ajustas a tu manera.
            </p>
            <div className="task-actions">
              <form action={createStandardTemplatesAction}>
                <SubmitButton pending="Creando…">Crear las cuatro</SubmitButton>
              </form>
              <Link href="/mensajes/nueva" className="button button-quiet">Escribir una desde cero</Link>
            </div>
          </div>
        </section>
      ) : (
        <ol className="roadmap plan" aria-label="Plantillas, en el orden en que se envían">
          {templates.map((template) => (
            <li key={template.id} className="plan-step">
              <p className="plan-when">{formatTiming(template)}</p>
              <Link href={`/mensajes/${template.id}`} className="plan-name">{template.name}</Link>
              <p className="plan-body"><Tokens text={template.body} /></p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

// Las variables se ven como piezas aparte del texto: lo que cambia en cada reserva.
function Tokens({ text }: { text: string }) {
  return text.split(/(\{[^{}]+\})/).map((part, i) => (i % 2 ? <code key={i} className="token">{part}</code> : part));
}
