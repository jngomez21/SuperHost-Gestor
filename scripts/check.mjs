import { neon } from "@neondatabase/serverless";

const APP_URL = process.env.APP_URL ?? "https://super-host-gestor.vercel.app";

const checks = {
  "Base de datos responde": async () => {
    const [row] = await neon(process.env.DATABASE_URL)`select 1 as ok`;
    return row.ok === 1;
  },
  "App desplegada (/login 200)": async () => {
    const res = await fetch(`${APP_URL}/login`, { redirect: "manual" });
    return res.status === 200;
  },
  "QStash exige firma (/api/cron/ping sin firma → 4xx)": async () => {
    const res = await fetch(`${APP_URL}/api/cron/ping`, { method: "POST" });
    return res.status >= 400 && res.status < 500 && res.status !== 404;
  },
};

let failed = 0;
for (const [name, check] of Object.entries(checks)) {
  const ok = await check().catch((err) => {
    console.error(`   ${err.message}`);
    return false;
  });
  console.log(`${ok ? "OK   " : "FALLA"} ${name}`);
  if (!ok) failed++;
}

process.exit(failed ? 1 : 0);
