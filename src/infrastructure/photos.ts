import { del, put } from "@vercel/blob";

// Fotos de la guía en Vercel Blob (ADR-008). El store tiene que ser público: la guía las enseña sin sesión.
export async function storePhoto(propertyId: string, file: File): Promise<string> {
  const blob = await put(`pisos/${propertyId}/${crypto.randomUUID()}.jpg`, file, {
    access: "public",
    contentType: file.type,
  });
  return blob.url;
}

export async function deletePhoto(url: string): Promise<void> {
  await del(url);
}
