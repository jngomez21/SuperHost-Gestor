import { Client } from "@upstash/qstash";

const APP_URL = process.env.APP_URL ?? "https://super-host-gestor.vercel.app";
const client = new Client({ token: process.env.QSTASH_TOKEN });

// Id fijo: volver a ejecutarlo actualiza el mismo horario en vez de crear otro.
await client.schedules.create({
  scheduleId: "dispatch",
  destination: `${APP_URL}/api/cron/dispatch`,
  cron: "*/5 * * * *",
});

for (const s of await client.schedules.list()) {
  console.log(`${s.scheduleId}  ${s.cron}  ${s.destination}${s.isPaused ? "  (pausado)" : ""}`);
}
