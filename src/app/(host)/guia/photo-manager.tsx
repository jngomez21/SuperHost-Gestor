"use client";

import { useState, useTransition } from "react";
import { addPhotoAction, movePhotoAction, removePhotoAction } from "./actions";

const LONG_SIDE = 1600;

// Reduce la foto en el navegador (lado largo de 1600 px, JPEG) antes de subirla (ADR-008).
async function compress(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("No se pudo preparar la foto.");
  return new File([blob], "foto.jpg", { type: "image/jpeg" });
}

export function PhotoManager({ propertyId, photos }: { propertyId: string; photos: { id: string; url: string }[] }) {
  const [status, setStatus] = useState("");
  const [busy, startTransition] = useTransition();

  function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    startTransition(async () => {
      const problems: string[] = [];
      for (const [i, file] of list.entries()) {
        setStatus(`Subiendo ${i + 1} de ${list.length}…`);
        try {
          const data = new FormData();
          data.set("photo", await compress(file));
          const problem = await addPhotoAction(propertyId, data);
          if (problem) problems.push(`${file.name}: ${problem}`);
        } catch {
          problems.push(`${file.name}: no se pudo leer la imagen.`);
        }
      }
      setStatus(problems.length ? problems.join(" ") : `Listo: ${list.length} ${list.length === 1 ? "foto subida" : "fotos subidas"}.`);
    });
  }

  const act = (fn: () => Promise<void>) => startTransition(fn);

  return (
    <section className="section" aria-labelledby="photos-title">
      <h2 id="photos-title" className="section-title">Fotos</h2>
      <p className="section-lead">La primera es la portada. Se ven en la guía de todos los huéspedes de este piso.</p>

      <div className="photo-upload">
        <label className="button button-skew">
          {busy ? "Subiendo…" : "Añadir fotos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="visually-hidden"
            disabled={busy}
            onChange={(event) => { upload(event.target.files); event.target.value = ""; }}
          />
        </label>
        <p className="msg-note" aria-live="polite">{status}</p>
      </div>

      {photos.length === 0 ? (
        <p className="section-lead">Todavía no hay fotos. Sin fotos, la guía empieza directamente con los datos de la estancia.</p>
      ) : (
        <ol className="photo-grid">
          {photos.map((photo, i) => (
            <li key={photo.id} className="photo-item">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de la foto ya comprimida en Blob */}
              <img src={photo.url} alt={`Foto ${i + 1}`} loading="lazy" />
              {i === 0 && <span className="chip chip-sent photo-cover">Portada</span>}
              <div className="photo-actions">
                {i > 0 && (
                  <button type="button" className="link-button" disabled={busy} onClick={() => act(() => movePhotoAction(propertyId, photo.id, "cover"))}>
                    Portada
                  </button>
                )}
                {i > 0 && (
                  <button type="button" className="link-button" disabled={busy} aria-label={`Mover la foto ${i + 1} antes`} onClick={() => act(() => movePhotoAction(propertyId, photo.id, "up"))}>
                    ←
                  </button>
                )}
                {i < photos.length - 1 && (
                  <button type="button" className="link-button" disabled={busy} aria-label={`Mover la foto ${i + 1} después`} onClick={() => act(() => movePhotoAction(propertyId, photo.id, "down"))}>
                    →
                  </button>
                )}
                <button type="button" className="link-button link-button-danger" disabled={busy} onClick={() => act(() => removePhotoAction(propertyId, photo.id))}>
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
