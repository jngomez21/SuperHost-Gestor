"use client";

import { useState } from "react";

// Copia un dato (la clave del wifi) y lo confirma en el propio botón.
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // Sin permiso de portapapeles: el dato sigue a la vista para copiarlo a mano.
    }
  }

  return (
    <button type="button" className="button button-small" onClick={copy} aria-live="polite">
      {done ? "¡Copiada!" : label}
    </button>
  );
}
