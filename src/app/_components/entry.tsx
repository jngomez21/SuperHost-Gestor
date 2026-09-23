import type { ReactNode } from "react";
import { Wordmark } from "./wordmark";

// Pantallas sueltas (acceso, errores, 404): logo grande, un símbolo, título y la acción.
export function Entry({ glyph, title, lead, children }: {
  glyph?: string;
  title: ReactNode;
  lead: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="entry">
      <Wordmark text="Gestor de llegadas" hero />
      {glyph && <p className="entry-glyph" aria-hidden="true">{glyph}</p>}
      <h1 className="entry-title">{title}</h1>
      <p className="entry-lead">{lead}</p>
      <div className="entry-body">{children}</div>
    </main>
  );
}
