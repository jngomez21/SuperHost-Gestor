import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function PanelPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main style={{ padding: 32 }}>
      <h1>Panel del host</h1>
      <p>Sesión activa: {session.user?.email}</p>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button type="submit">Cerrar sesión</button>
      </form>
    </main>
  );
}
