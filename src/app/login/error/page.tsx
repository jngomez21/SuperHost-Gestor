import Link from "next/link";
import { HangingTag } from "@/app/_components/key-tag";

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
    <main className="entry">
      <div>
        <h1 className="entry-title">{message.title}</h1>
        <p className="entry-lead">{message.text}</p>
      </div>

      <HangingTag number="Nº ?" caption="Llave sin validar">
        <div className="tag-form">
          <Link className="button" href="/login">Pedir un enlace nuevo</Link>
        </div>
      </HangingTag>
    </main>
  );
}
