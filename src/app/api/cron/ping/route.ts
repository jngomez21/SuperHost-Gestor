import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";

async function handler() {
  console.log("QStash ping recibido:", new Date().toISOString());
  return new Response("ok");
}

export const POST = verifySignatureAppRouter(handler);
