import Link from "next/link";
import { HangingTag } from "@/app/_components/key-tag";

export default function NotFound() {
  return (
    <main className="entry">
      <div>
        <h1 className="entry-title">Esta llave no abre ninguna puerta.</h1>
        <p className="entry-lead">
          La página que buscas no existe o no es tuya. Revisa el enlace o vuelve a tus pisos.
        </p>
      </div>

      <HangingTag number="404" caption="Sin puerta">
        <div className="tag-form">
          <Link className="button" href="/panel">Volver al panel</Link>
        </div>
      </HangingTag>
    </main>
  );
}
