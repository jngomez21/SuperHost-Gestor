import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { dispatchDue } from "@/application/dispatch";

// Si falla, responde 500 y QStash reintenta; los enlaces del email apuntan al mismo despliegue.
async function handler(request: Request) {
  return Response.json(await dispatchDue(new URL(request.url).origin));
}

export const POST = verifySignatureAppRouter(handler);
