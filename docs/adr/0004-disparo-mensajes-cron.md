# ADR-004: Disparo de mensajes/avisos programados

## Contexto

Varias historias de `SPEC.md` requieren disparar acciones por tiempo: mensaje de check-in N horas antes de la llegada, recordatorio de check-out, aviso si la checklist no está completa antes del check-in. El volumen esperado es bajo: un host, decenas de reservas activas como mucho. La fiabilidad del disparo es crítica: es literalmente la propuesta de valor del producto (proteger la tasa de respuesta y evitar incidencias que cuesten una reseña).

Se evaluaron varios mecanismos concretos de "quién invoca la tarea periódica" (septiembre 2026):

- **Vercel Cron**: en el plan gratuito (Hobby), cualquier cron con frecuencia mayor a una vez al día falla al desplegar, y la hora solo se garantiza dentro de esa hora. Insuficiente para recordatorios que necesitan granularidad de minutos.
- **cron-job.org**: gratis, hace ping a una URL periódicamente, pero sin reintentos ni SLA. Si la llamada a la API falla de forma transitoria, el mensaje simplemente no se envía y no hay forma de saberlo.
- **GitHub Actions (schedule)**: gratis, pero mediciones reales muestran que jobs configurados "cada minuto" en la práctica disparan cada ~2.5 horas. No cumple la precisión necesaria.
- **Upstash QStash**: servicio HTTP diseñado específicamente para programar y entregar llamadas a una API, con entrega garantizada "al menos una vez" y reintentos automáticos si la llamada falla. Free tier: 1.000 mensajes/día.

## Opciones consideradas

1. **Cola de mensajes con jobs programados individualmente** (ej. Redis/BullMQ autoalojado) — cada disparo se agenda como un job independiente con su propio delay.
2. **Cron periódico simple sin reintentos** (Vercel Cron / cron-job.org / GitHub Actions) — un job programado escanea reservas próximas y dispara lo que corresponda.
3. **Cron periódico con entrega garantizada** (Upstash QStash) — mismo patrón que la opción 2, pero el servicio reintenta automáticamente si la llamada a la API falla.

## Decisión

Upstash QStash, invocando cada 5 minutos un endpoint propio que escanea reservas próximas y dispara lo que corresponda (opción 3).

Se descarta la opción 1 (cola autoalojada) por el mismo motivo que en la versión anterior de esta ADR: con decenas de reservas, no hay volumen que la justifique — es infraestructura que alguien tiene que operar sin necesidad real. Se descarta cron-job.org/GitHub Actions/Vercel Cron (dentro de la opción 2) porque ninguno ofrece reintentos, y un fallo transitorio de red o de base de datos se traduciría en un mensaje que nunca llega y nadie lo nota — el fallo silencioso es exactamente el tipo de incidencia que el producto existe para evitar.

## Consecuencias

**Positivas**
- Sin infraestructura propia que operar (ni Redis, ni un broker, ni un servidor de cron) — QStash es un servicio gestionado, gratis al volumen actual (~288 llamadas/día con un intervalo de 5 min, muy por debajo del límite de 1.000/día).
- Entrega garantizada con reintentos: un fallo transitorio no se traduce en un mensaje perdido sin que nadie se entere.
- Con decenas de reservas, escanear "¿qué debe dispararse en los próximos 5 minutos?" en cada invocación es una consulta trivial, no un cuello de botella.

**Negativas**
- La precisión del disparo depende del intervalo elegido (5 min) — aceptable para mensajes de check-in/check-out, no para nada que requiera precisión al segundo.
- Introduce una dependencia de un proveedor externo adicional (más allá de Neon y el hosting de la app) — mitigado porque es un servicio de propósito único (HTTP scheduling), fácil de sustituir por otro similar si hiciera falta, ya que la lógica de negocio vive en el endpoint propio, no en QStash.

**Riesgos y ceiling**
- `ponytail: escaneo periódico simple, sin cola dedicada — si el volumen crece a cientos de reservas activas simultáneas o se supera el free tier de QStash, evaluar una cola con jobs programados individualmente.`
