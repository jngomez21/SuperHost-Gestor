import Link from "next/link";
import { Entry } from "@/app/_components/entry";

const MESSAGES: Record<string, { title: string; text: string }> = {
  Verification: {
    title: "Este enlace ya se usó o caducó.",
    text: "Cada enlace sirve una sola vez. Pide uno nuevo y ábrelo solo una vez.",
  },
  AccessDenied: {
    title: "Este email no tiene acceso.",
    text: "Solo el email del host puede entrar. Revisa que lo escribiste bien.",
  },
};

const FALLBACK = {
  title: "No pudimos iniciar tu sesión.",
  text: "Pide un enlace nuevo. Si vuelve a fallar, revisa la configuración del correo.",
};

export default async function AuthErrorPage({ searchParams }: PageProps<"/login/error">) {
  const { error } = await searchParams;
  const message = MESSAGES[String(error)] ?? FALLBACK;

  return (
    <Entry glyph="!" title={message.title} lead={message.text}>
      <Link className="button button-skew" href="/login">Pedir un enlace nuevo</Link>
    </Entry>
  );
}
