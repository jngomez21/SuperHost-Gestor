import { HandNote } from "@/app/_components/hand-note";

// Enlace inventado, regenerado o de una reserva cancelada: no se dice cuál (ADR-007).
export default function GuestLinkNotFound() {
  return (
    <main className="entry">
      <p className="entry-glyph" aria-hidden="true">!</p>
      <h1 className="entry-title">Este enlace no <span className="boxed">funciona</span></h1>
      <p className="entry-lead">
        Puede que tu anfitrión te haya mandado uno nuevo. Búscalo en el chat de Airbnb o pídeselo por allí.
      </p>
      <div className="entry-body">
        <HandNote>Tu anfitrión te responde por Airbnb</HandNote>
      </div>
    </main>
  );
}
