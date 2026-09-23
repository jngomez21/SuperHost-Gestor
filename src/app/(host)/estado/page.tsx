import Link from "next/link";
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
  { name: "Checklist de limpieza", state: "Hecho", status: "done" },
  { name: "Mensajes automáticos", state: "En curso", status: "next" },
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
      detail: "Envía tus enlaces de acceso y, pronto, los avisos de mensajes por enviar",
    },
    {
      name: "Recordatorios",
      ok: Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY),
      stamp: process.env.QSTASH_CURRENT_SIGNING_KEY ? "Conectados" : "Sin configurar",
      detail: "Recibe avisos programados para disparar mensajes a tiempo",
    },
  ];

  return (
    <main className="page">
      <p><Link href="/panel" className="back-link">Panel</Link></p>
      <h1 className="page-title">Estado del <span className="boxed">sistema</span></h1>
      <p className="page-lead">
        Las piezas de las que depende el gestor, comprobadas ahora mismo, y lo que falta por construir.
      </p>

      <section className="section" aria-labelledby="board-title">
        <h2 id="board-title" className="section-title">Lo que ya funciona</h2>
        <ul className="keyboard">
          {keys.map((key) => (
            <li key={key.name}>
              <div className={`keycap${key.ok ? "" : " keycap-arrival"}`}>
                <span className="keycap-name">{key.name}</span>
                <span className={`chip ${key.ok ? "chip-free" : "chip-cancelled"}`}>{key.stamp}</span>
                <span className="keycap-detail">{key.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="path-title">
        <h2 id="path-title" className="section-title">Por fases</h2>
        <ol className="roadmap">
          {PHASES.map((phase, i) => (
            <li key={phase.name} className={phase.status ? `phase-${phase.status}` : undefined}>
              <p className="phase-name">Fase {i}: {phase.name}</p>
              <p className="phase-state">{phase.state}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
