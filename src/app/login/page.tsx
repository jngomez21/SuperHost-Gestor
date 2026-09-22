import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Acceso del host</h1>
      <form
        action={async (formData) => {
          "use server";
          await signIn("resend", formData);
        }}
      >
        <input type="email" name="email" placeholder="tu@email.com" required />
        <button type="submit">Enviarme un enlace de acceso</button>
      </form>
    </main>
  );
}
