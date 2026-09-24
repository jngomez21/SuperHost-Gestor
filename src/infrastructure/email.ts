import { Resend } from "resend";

// Sin dominio propio, Resend solo entrega a la dirección de la cuenta: el host (ADR-006).
export async function sendEmail(to: string, subject: string, text: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.AUTH_RESEND_FROM!, to, subject, text });
  if (error) throw new Error(`Resend no envió el aviso: ${error.message}`);
}
