import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { auth, signOut } from "@/auth";
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
  { name: "Pisos y reservas", state: "Lo siguiente", status: "next" },
  { name: "Checklist de limpieza", state: "Pendiente", status: "" },
  { name: "Mensajes automáticos", state: "Pendiente", status: "" },
  { name: "Avisos cruzados", state: "Pendiente", status: "" },
];

export default async function PanelPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const database = await checkDatabase();
  const expires = new Date(session.expires).toLocaleDateString("es-CO", {
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
          <h1 className="panel-title">Hola, {session.user.email.split("@")[0]}.</h1>
          <p className="panel-lead">
            Todavía no hay reservas que gestionar: esto es lo que ya funciona
            por debajo, comprobado ahora mismo.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="button button-quiet">Cerrar sesión</button>
        </form>
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
