import { signOut } from "@/auth";
import { requireHost } from "@/app/_lib/host";
import { NavLink } from "@/app/_components/nav-link";

export default async function HostLayout({ children }: LayoutProps<"/">) {
  await requireHost();

  return (
    <>
      <header className="topbar">
        <p className="wordmark">Gestor de llegadas</p>
        <nav className="topbar-nav" aria-label="Principal">
          <NavLink href="/panel">Llegadas</NavLink>
          <NavLink href="/pisos">Pisos</NavLink>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button type="submit" className="button button-quiet">Cerrar sesión</button>
        </form>
      </header>
      {children}
    </>
  );
}
