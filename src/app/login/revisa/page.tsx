import Link from "next/link";
import { HangingTag } from "@/app/_components/key-tag";

export default function CheckEmailPage() {
  return (
    <main className="entry">
      <div>
        <h1 className="entry-title">Tu enlace va en camino.</h1>
        <p className="entry-lead">
          Puede tardar un par de minutos en llegar. Si no lo ves, revisa la
          carpeta de spam.
        </p>
      </div>

      <HangingTag number="✉" caption="Revisa tu correo">
        <p className="tag-text">
          Abre el enlace una sola vez: deja de servir en cuanto lo usas.
        </p>
        <div className="tag-form">
          <Link className="button" href="/login">Usar otro email</Link>
        </div>
      </HangingTag>
    </main>
  );
}
