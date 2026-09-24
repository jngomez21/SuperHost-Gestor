import Link from "next/link";
import { sql } from "drizzle-orm";
import { Client } from "@upstash/qstash";
import { hostMetrics, METRICS_DAYS } from "@/application/metrics";
import { requireHost } from "@/app/_lib/host";
import { formatDuration } from "@/app/_lib/format";
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

// Que haya clave no basta: se pregunta a QStash si el horario del despachador existe y corre.
async function checkScheduler() {
  try {
    const schedule = await new Client({ token: process.env.QSTASH_TOKEN!, retry: false }).schedules.get("dispatch");
    return schedule.isPaused
      ? { ok: false, stamp: "En pausa", detail: "El horario de avisos está pausado en QStash." }
      : { ok: true, stamp: "Activos", detail: "Cada 5 minutos revisan qué mensajes tocan y qué pisos faltan por preparar, y te escriben" };
  } catch {
    return { ok: false, stamp: "Sin horario", detail: "No se pudo comprobar el horario en QStash. ¿Falta ejecutar npm run schedule?" };
  }
}

const PHASES = [
  { name: "Cimientos", state: "Hecho", status: "done" },
  { name: "Pisos y reservas", state: "Hecho", status: "done" },
  { name: "Checklist de limpieza", state: "Hecho", status: "done" },
  { name: "Mensajes automáticos", state: "Hecho", status: "done" },
  { name: "Avisos cruzados", state: "En curso", status: "next" },
];

export default async function StatusPage() {
  const host = await requireHost();
  const [database, scheduler, metrics] = await Promise.all([checkDatabase(), checkScheduler(), hostMetrics(host.id)]);
  const { response, arrivals, unready } = metrics;
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
      detail: "Envía tus enlaces de acceso y los avisos de mensajes y pisos por preparar",
    },
    { name: "Avisos", ...scheduler },
  ];

  return (
    <main className="page">
      <p><Link href="/panel" className="back-link">Panel</Link></p>
      <h1 className="page-title">Estado del <span className="boxed">sistema</span></h1>
      <p className="page-lead">
        Las piezas de las que depende el gestor, comprobadas ahora mismo, tus primeras métricas y lo
        que falta por construir.
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

      <section className="section" aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="section-title">Últimos {METRICS_DAYS} días</h2>
        <p className="section-lead">
          {response.count} {response.count === 1 ? "mensaje enviado" : "mensajes enviados"} y {arrivals}{" "}
          {arrivals === 1 ? "llegada" : "llegadas"}. La respuesta se mide desde que toca el mensaje hasta que lo
          marcas enviado.
        </p>
        <dl className="stats">
          <div className="stat">
            <dt className="stat-label">Respuesta, mediana</dt>
            <dd className="stat-number">{response.median === null ? "—" : formatDuration(response.median)}</dd>
          </div>
          <div className="stat">
            <dt className="stat-label">Respuesta más lenta</dt>
            <dd className="stat-number">{response.slowest === null ? "—" : formatDuration(response.slowest)}</dd>
          </div>
          <div className="stat">
            <dt className="stat-label">Llegadas sin terminar</dt>
            <dd className={`stat-number${unready ? " stat-alert" : ""}`}>
              {unready}<span className="stat-of">/{arrivals}</span>
            </dd>
          </div>
        </dl>
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
