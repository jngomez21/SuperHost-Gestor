import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { HangingTag } from "@/app/_components/key-tag";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function LoginPage() {
  if (await auth()) redirect("/panel");

  return (
    <main className="entry">
      <div>
        <h1 className="entry-title">Cada llegada lista antes que tu huésped.</h1>
        <p className="entry-lead">
          Mensajes, limpieza y estado de cada reserva en un solo sitio. Entra con
          tu email: te mandamos un enlace de acceso, sin contraseña.
        </p>
      </div>

      <HangingTag number="Nº 1" caption="Llave del host">
        <form
          className="tag-form"
          action={async (formData) => {
            "use server";
            await signIn("resend", { email: formData.get("email"), redirectTo: "/panel" });
          }}
        >
          <label className="tag-label" htmlFor="email">Tu email</label>
          <input
            id="email"
            className="tag-input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
          />
          <SubmitButton pending="Enviando enlace…">Enviarme el enlace</SubmitButton>
        </form>
      </HangingTag>
    </main>
  );
}
