import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Entry } from "@/app/_components/entry";
import { HandNote } from "@/app/_components/hand-note";
import { SubmitButton } from "@/app/_components/submit-button";

export default async function LoginPage() {
  if (await auth()) redirect("/panel");

  return (
    <Entry
      title={<>Cada llegada lista antes que tu <span className="boxed">huésped</span></>}
      lead="Mensajes, limpieza y estado de cada reserva en un solo sitio."
    >
      <HandNote arrow="down" className="entry-note">Sin contraseña: te llega un enlace al correo</HandNote>
      <form
        className="entry-card"
        action={async (formData) => {
          "use server";
          await signIn("resend", { email: formData.get("email"), redirectTo: "/panel" });
        }}
      >
        <label className="field-label" htmlFor="email">Tu email</label>
        <input
          id="email"
          className="input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="tu@email.com"
          required
        />
        <SubmitButton pending="Enviando enlace…" skew>Enviarme el enlace</SubmitButton>
      </form>
    </Entry>
  );
}
