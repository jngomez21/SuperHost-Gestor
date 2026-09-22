import { Client } from "@upstash/qstash";

const client = new Client({
  token: process.env.QSTASH_TOKEN,
  baseUrl: "https://qstash-us-east-1.upstash.io",
});

const res = await client.publishJSON({
  url: "https://super-host-gestor.vercel.app/api/cron/ping",
  body: { test: true },
});

console.log("Mensaje publicado:", res);
