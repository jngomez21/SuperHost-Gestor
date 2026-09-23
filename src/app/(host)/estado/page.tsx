import { sql } from "drizzle-orm";
import { requireHost } from "@/app/_lib/host";
import { db } from "@/infrastructure/db";

async function checkDatabase() {
  const start = performance.now();
  try {
    await db.execute(sql`select 1`);
    return { ok: true, detail: `Respondió en ${Math.round(performance.now() - start)} ms` };
  } catch {
    return { ok: false, detail: "No responde. Revisa DATABASE_URL." };
  }
}

const PHASES = [
  { name: "Cimientos", state: "Hecho", status: "done" },
  { name: "Pisos y reservas", state: "Hecho", status: "done" },
  { name: "Checklist de limpieza", state: "Lo siguiente", status: "next" },
  { name: "Mensajes automáticos", state: "Pendiente", status: "" },
  { name: "Avisos cruzados", state: "Pendiente", status: "" },
];

export default async function StatusPage() {
  const host = await requireHost();
  const database = await checkDatabase();
  const expires = new Date(host.expires).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
  });

  const keys = [
    {
      name: "Acceso",
      ok: true,
      stamp: "Sesión activa",
      detail: `Válida hasta el ${expires}`,
    },
    {
      name: "Base de datos",
      ok: database.ok,
      stamp: database.ok ? "Conectada" : "Sin conexión",
      detail: database.detail,
    },
    {
      name: "Correo",
      ok: Boolean(process.env.RESEND_API_KEY),
      stamp: process.env.RESEND_API_KEY ? "Listo" : "Sin configurar",
      detail: "Envía tus enlaces de acceso y, pronto, los mensajes a huéspedes",
    },
    {
      name: "Recordatorios",
      ok: Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY),
      stamp: process.env.QSTASH_CURRENT_SIGNING_KEY ? "Conectados" : "Sin configurar",
      detail: "Recibe avisos programados para disparar mensajes a tiempo",
    },
  ];

  return (
    <main className="panel">
      <header className="panel-head">
        <div>
          <h1 className="panel-title">Estado del sistema</h1>
          <p className="panel-lead">
            Las piezas de las que depende el gestor, comprobadas ahora mismo, y lo que
            falta por construir.
          </p>
        </div>
      </header>

      <section className="board" aria-labelledby="board-title">
        <h2 id="board-title" className="section-title">Lo que ya funciona</h2>
        <ul className="board-rail">
          {keys.map((key) => (
            <li key={key.name} className="slot">
              <div className="slot-hook" aria-hidden="true" />
              <div className="tag">
                <p className="slot-name">{key.name}</p>
                <span className={`stamp ${key.ok ? "stamp-ok" : "stamp-bad"}`}>{key.stamp}</span>
                <p className="slot-detail">{key.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="path" aria-labelledby="path-title">
        <h2 id="path-title" className="section-title">Lo que viene</h2>
        <ol className="path-list">
          {PHASES.map((phase, i) => (
            <li key={phase.name} className={`step ${phase.status ? `step-${phase.status}` : ""}`}>
              <span className="step-number">{i}</span>
              <span className="step-name">{phase.name}</span>
              <span className="step-state">{phase.state}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
