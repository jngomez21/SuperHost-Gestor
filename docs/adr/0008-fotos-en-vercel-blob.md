# ADR-008: Fotos de los pisos en Vercel Blob

## Contexto

La guía del huésped (Fase 5) muestra fotos de cada piso que el host sube desde la app. Hasta ahora el sistema solo guardaba texto en Postgres (Neon, ADR-005); no había dónde guardar archivos. El volumen es pequeño (un host, unas decenas de fotos por piso) y las fotos se ven sobre todo desde el móvil del huésped, a menudo con datos móviles.

## Opciones consideradas

1. **Vercel Blob**: almacenamiento de archivos del mismo proveedor donde se despliega la app. Las fotos se sirven desde su CDN.
2. **En la base de datos**: las fotos comprimidas en una tabla de Neon, servidas por una ruta de la app. Sin proveedor nuevo, pero cada foto pasa por una función y por la BD, y ocupa el almacenamiento y la transferencia del plan gratuito de Neon.
3. **Cloudinary**: especializado en imágenes, con recorte y optimización al vuelo; otra cuenta, otra clave y otro proveedor del que depender.
4. **Cloudflare R2 / Amazon S3**: almacenamiento genérico barato; más configuración (cuenta, claves, permisos) de la que justifica este volumen.
5. **Enlaces externos** (Google Fotos, Drive): sin almacenamiento propio, pero los enlaces caducan o cambian de permisos y la foto desaparece de la guía.

## Decisión

Opción 1, Vercel Blob.

- Se activa desde el panel de Vercel y crea sola la variable `BLOB_READ_WRITE_TOKEN` en el proyecto; en local se copia a `.env.local`.
- Las fotos se comprimen en el navegador antes de subir (lado largo de 1600 px, JPEG), así que cada una pesa unos cientos de KB y cabe en una Server Action (límite subido a 3 MB).
- En la BD solo se guarda la URL pública de cada foto y su posición; la primera es la portada. Quitar una foto la borra también de Blob.

## Consecuencias

**Positivas**
- Las fotos cargan rápido desde la CDN, sin pasar por la app ni por la BD.
- Sin cuentas nuevas: todo sigue en Vercel y Neon.

**Negativas**
- Un servicio más del que depende la guía; si Blob no responde, la guía se ve sin fotos (el resto sigue funcionando).
- Las URLs de Blob son públicas: quien tenga la URL exacta de una foto la ve. Se acepta: son fotos del anuncio, no datos privados.

**Riesgos y ceiling**
- `ponytail: una foto por Server Action con compresión en el navegador — si hicieran falta fotos grandes o muchas a la vez, pasar a subida directa desde el navegador con token de cliente (handleUpload de @vercel/blob).`
