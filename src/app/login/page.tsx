import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/panel");

  return (
    <main style={{ padding: 32 }}>
      <h1>Acceso del host</h1>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", { ...Object.fromEntries(formData), redirectTo: "/panel" });
        }}
      >
        <input type="email" name="email" placeholder="tu@email.com" required />
        <button type="submit">Enviarme un enlace de acceso</button>
      </form>
    </main>
  );
}
