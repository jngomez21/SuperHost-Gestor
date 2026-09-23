import Link from "next/link";
import { Entry } from "@/app/_components/entry";

export default function NotFound() {
  return (
    <Entry
      glyph="404"
      title={<>Esta llave no abre ninguna <span className="boxed">puerta</span></>}
      lead="La página que buscas no existe o no es tuya. Revisa el enlace o vuelve a tus pisos."
    >
      <Link className="button button-skew" href="/panel">Volver al panel</Link>
    </Entry>
  );
}
