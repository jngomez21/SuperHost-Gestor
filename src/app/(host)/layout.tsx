import Link from "next/link";
import { signOut } from "@/auth";
import { requireHost } from "@/app/_lib/host";
import { NavLink } from "@/app/_components/nav-link";
import { Preferences } from "@/app/_components/preferences";
import { Wordmark } from "@/app/_components/wordmark";

export default async function HostLayout({ children }: LayoutProps<"/">) {
  await requireHost();

  return (
    <>
      <div className="topbar-wrap">
        <header className="topbar">
          <Link href="/panel" className="topbar-home">
            <Wordmark text="Gestor de llegadas" />
          </Link>
          <nav className="topbar-nav" aria-label="Principal">
            <NavLink href="/panel">Llegadas</NavLink>
            <NavLink href="/reservas">Reservas</NavLink>
            <NavLink href="/pisos">Pisos</NavLink>
            <NavLink href="/mensajes">Mensajes</NavLink>
          </nav>
          <div className="topbar-tools">
            <Preferences />
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="button button-quiet button-small">Salir</button>
            </form>
          </div>
        </header>
      </div>
      {children}
    </>
  );
}
