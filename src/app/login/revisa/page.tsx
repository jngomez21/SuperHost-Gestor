import Link from "next/link";
import { Entry } from "@/app/_components/entry";
import { HandNote } from "@/app/_components/hand-note";

export default function CheckEmailPage() {
  return (
    <Entry
      title={<>Tu enlace va en <span className="boxed">camino</span></>}
      lead="Puede tardar un par de minutos en llegar. Si no lo ves, revisa la carpeta de spam."
    >
      <HandNote className="entry-note">Ábrelo una sola vez: deja de servir en cuanto lo usas</HandNote>
      <Link className="button button-quiet" href="/login">Usar otro email</Link>
    </Entry>
  );
}
