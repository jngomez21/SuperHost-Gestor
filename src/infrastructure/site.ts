// Dirección pública de la app, para los enlaces que salen de ella (el del huésped va pegado en Airbnb).
// APP_URL manda si está; si no, Vercel da el dominio de producción; en local, el servidor de desarrollo.
export function siteUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

// Para las vistas previas de las plantillas: un enlace con la forma real que no abre ninguna estancia.
export const EXAMPLE_TOKEN = "00000000-0000-4000-8000-000000000000";

export function guestLink(token: string): string {
  return `${siteUrl()}/estancia/${token}`;
}
