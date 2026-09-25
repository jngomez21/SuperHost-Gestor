# Roadmap

Basado en `SPEC.md` (historias de usuario) y `ARCHITECTURE.md` (módulos de dominio y ADRs). Las fases siguen las dependencias reales entre módulos (`property` → `reservation` → `housekeeping`/`messaging`), no un orden arbitrario de prioridad de negocio. Cada fase, al cerrarse, deja algo funcionando de punta a punta — ninguna depende de rehacer trabajo de una fase anterior.

## Fase 0 — Fundaciones técnicas (walking skeleton) ✅ Hecha

Cambios respecto al plan original: Drizzle en lugar de Prisma (ADR-003), driver HTTP de Neon por el proxy corporativo, y la 0.7 quedó como `npm run check` (BD, deploy y firma de QStash).

Sin historias de usuario propias. Objetivo: probar que cada pieza externa de las ADRs funciona de extremo a extremo, sin lógica de negocio encima, para no descubrir un fallo de integración a mitad de una fase con trabajo real ya construido.

| # | Tarea | Qué demuestra | Referencia |
|---|---|---|---|
| 0.1 | Scaffold Next.js (TypeScript, App Router) con la estructura de carpetas de `ARCHITECTURE.md` (`domain/`, `application/`, `infrastructure/`, `ui/`) | El monolito modular tiene dónde vivir cada módulo desde el día uno | ADR-001, ADR-002 |
| 0.2 | Prisma + Neon: `DATABASE_URL` como variable de entorno, una migración dummy, un read/write de prueba | La conexión a la BD gestionada funciona | ADR-003, ADR-005 |
| 0.3 | Auth.js con login sin contraseña (magic link) usando el mismo Resend que luego usará mensajería para huéspedes | El host entra desde cualquier PC/ubicación; una sola integración de email sirve para login y para mensajes | ADR-005 |
| 0.4 | Despliegue en Vercel con variables de entorno de producción configuradas | El pipeline de build/deploy es real, no solo local | ADR-002 |
| 0.5 | Ruta `/api/cron/ping` registrada en QStash, que solo escribe un log al ser llamada | El mecanismo de disparo por tiempo funciona antes de que la lógica de negocio dependa de él | ADR-004 |
| 0.6 | Endpoint que envía un email de prueba vía Resend | El canal de notificación al huésped funciona de extremo a extremo | ADR-004 |
| 0.7 | Un check mínimo (script o test) que verifique login + una escritura en BD + el ping de QStash | Detecta si el esqueleto se rompe más adelante, sin montar un framework de tests todavía | — |

**Hecho cuando:** los 4 proveedores externos (Neon, Auth.js/Resend, QStash, Resend) están probados de forma aislada en producción. Cero valor para el host todavía, cero incertidumbre técnica de aquí en adelante.

## Fase 1 — Núcleo: Propiedades y Reservas ✅ Hecha

Cambios respecto al plan: se añadió `/reservas` (libro de huéspedes con historial), necesario para volver a las notas de estancias pasadas; el estado del sistema pasó a `/estado`; y el panel quedó como casillero de llaves por piso más una agenda de 7 días. Los casos de uso se verificaron contra la BD a mano; automatizar esos tests requiere una rama de Neon para pruebas.

Historias 14, 15, 16, 17, 18. Módulo del que dependen `housekeeping` y `messaging`. Se elige primero porque nada más puede construirse sin él.

### Decisiones

- **Estado derivado, no guardado.** Se calcula al leer a partir de fechas y horas: *cancelada* (tiene `cancelledAt`, único estado manual) → *terminada* (pasó el check-out) → *huésped en casa* (entre check-in y check-out) → *próxima*. Sin cron ni columna `status` que pueda desincronizarse.
- **Solapamientos bloqueados en la BD**: restricción `EXCLUDE` sobre el rango de fechas por piso, más un `CHECK` de salida posterior a la llegada.
- **Una sola zona horaria** (`America/Bogota`) para toda la app; todos los pisos están en Colombia. Si aparece un piso en otra zona, se añade la zona al piso.
- **Huésped**: nombre, email, teléfono y nº de huéspedes. El teléfono se guarda pero no se usa hasta que haya un canal SMS/WhatsApp.
- **Cancelación** con fecha (`cancelledAt`): las canceladas salen del tablero pero quedan en el historial.
- **Notas en tabla propia** (`reservation_note`), para guardar un historial de incidencias.
- **Migraciones registradas** con el migrador de Drizzle por HTTP; `0000` se marca como ya aplicada.
- **Tests** de la lógica de estados y fechas con `node --test` (sin dependencias nuevas).

### Tareas

| # | Tarea | Historias |
|---|---|---|
| 1.1 | Migrador de Drizzle y marcar `0000` como aplicada | — |
| 1.2 | Esquema: `property`, `reservation`, `reservation_note` + restricciones | 15, 18 |
| 1.3 | Dominio: estado derivado de las fechas, con tests | 16 |
| 1.4 | Casos de uso: crear/editar piso, crear/cancelar reserva, añadir nota, listar reservas | 14–18 |
| 1.5 | Pantallas de pisos: lista, alta y edición | 18 |
| 1.6 | Pantallas de reservas: alta y detalle con notas | 15, 17 |
| 1.7 | Panel como tablero de llegadas: llegan hoy, en casa ahora, salen hoy, próximos 7 días | 14 |

**Fuera de esta fase:** importar reservas desde el calendario iCal de Airbnb (barato de añadir después).

**Hecho cuando:** el host puede dar de alta un piso, registrar una reserva y ver su estado en el panel, sin nada automatizado todavía.

## Fase 2 — Checklist de preparación ✅ Hecha

Cambios respecto al plan: la ficha de la reserva enlaza a su preparación (o a crear la lista si el piso no tiene); la pantalla de preparar avisa mientras guarda y pide confirmación si se cierra a mitad de guardado. La 2.7 revisó todo a 320–390 px y en modo claro: piezas de papel con canto propio en claro, bordes de campos a 3:1, horas y fechas que no se parten, y sin scroll horizontal.

Historias 9, 10, 11, 12. Depende solo de la Fase 1. Va antes que mensajería porque es la pieza más simple de las dos que faltan (CRUD + estado, sin proveedores externos ni disparo por tiempo) — valida que el modelo de reserva aguanta antes de meter la complejidad de QStash/Resend.

### Decisiones

- **Lista por piso**, que nace de una lista estándar al crear el piso y se edita por piso (añadir, renombrar, quitar). Lista estándar: cambiar sábanas, toallas limpias, limpiar baño, limpiar cocina y nevera, sacar la basura, reponer papel/jabón/café, revisar que el wifi funciona, dejar la llave lista.
- **La preparación pertenece a la llegada** (se prepara el piso *para* un huésped), no al piso: cada reserva tiene sus propias tareas marcadas.
- **"Listo" se deriva**: una llegada está lista cuando todas las tareas actuales de su piso están marcadas. Añadir una tarea deja pendientes las llegadas afectadas.
- **Marca el host desde el móvil**: casillas grandes que guardan al tocarlas. Acceso para personal de limpieza fuera de alcance.
- **Sin revisión de salida** por ahora: lo que se encuentre al salir va a la bitácora de la reserva.

### Tareas

| # | Tarea | Historias |
|---|---|---|
| 2.1 | Esquema: tareas del piso y tareas marcadas por reserva, con migración | 9, 10, 12 |
| 2.2 | Dominio: lista estándar, progreso y "listo" derivados, con tests | 9, 11 |
| 2.3 | Casos de uso: editar tareas del piso; marcar/desmarcar por reserva | 10, 12 |
| 2.4 | Pantalla: tareas del piso, dentro de la edición del piso | 12 |
| 2.5 | Pantalla: preparar una llegada, pensada para móvil | 10 |
| 2.6 | Panel: progreso en casillero y agenda, sección "Por preparar" | 11 |
| 2.7 | Pasada de móvil y modo claro sobre todas las pantallas | — |

**Hecho cuando:** el host tiene una checklist reutilizable y ve de un vistazo qué pisos están listos para la próxima llegada.

## Fase 3 — Mensajería automática ✅ Hecha

Cambios respecto al plan: las plantillas tienen sección propia (`/mensajes`) en la navegación. El email-resumen va en texto plano, para copiar cada mensaje tal cual, y enlaza a cada uno en la ficha de la reserva. El horario de QStash se crea con `npm run schedule` (id fijo `dispatch`: volver a ejecutarlo lo actualiza), y `npm run check` comprueba que el despachador exige firma. Al rellenar, un dato que acaba en punto ya no deja dos seguidos ("p. m.."). **Para activarla en producción**: desplegar y ejecutar `npm run schedule` una vez. La cuenta de QStash está en `us-east-1`, así que `QSTASH_URL=https://qstash-us-east-1.upstash.io` tiene que estar en `.env.local` y en Vercel; sin ella el cliente va a la región por defecto y no encuentra la cuenta.

Historias 1-8 y 19. La pieza que protege directamente las métricas de Superhost (tasa de respuesta). Es la más compleja: plantillas + variables + integración con QStash y Resend — se deja para después de validar Fases 1-2 con el modelo de reserva ya probado.

### Decisiones

- **Canal: copiar y pegar en Airbnb** (ADR-006). El gestor no escribe al huésped: cuando toca un mensaje, avisa al host (en el panel y con un email a su propia dirección, que Resend permite sin dominio propio) con el texto ya relleno. El host lo pega en el chat de Airbnb y lo marca como enviado. La conversación sigue en Airbnb, donde se mide la tasa de respuesta. El email del huésped pasa a ser opcional.
- **Plantillas por host**, no por piso: las diferencias entre pisos las cubren las variables (`{wifi}`, `{como_entrar}`…). Hay cuatro estándar, que el host crea con un botón y luego edita: bienvenida (al registrar la reserva), instrucciones de llegada (el día antes, 10:00), recordatorio de salida (el día antes de salir, 19:00) y despedida con petición de reseña (el día de salida, 14:00).
- **Cuándo se envía: día + hora** respecto a la llegada o la salida ("el día antes a las 10:00"), en hora de Colombia, para que nunca caiga de madrugada. La bienvenida toca en cuanto se registra la reserva.
- **Los mensajes se programan al registrar la reserva**, una fila por plantilla con su hora de envío. Cambiar el horario de una plantilla o añadir una nueva afecta solo a las reservas nuevas; así una plantilla nueva no llena de pendientes las reservas pasadas.
- **El texto se rellena al mostrarlo**, con los datos actuales del piso y de la plantilla, salvo que el host lo haya editado para esa reserva. Al marcarlo enviado se guarda el texto exacto: el historial muestra lo que se envió de verdad.
- **Estado derivado**, como el de la reserva: cancelado → enviado → por enviar (ya pasó su hora) → programado. Cancelar la reserva deja sus mensajes pendientes fuera sin tocarlos.
- **Variable sin dato** (por ejemplo, wifi vacío): se muestra como `[falta: clave del wifi]` para que el host lo vea antes de pegar.
- **Historia 4, reformulada**: el gestor no ve la bandeja de Airbnb. En su lugar, si un mensaje lleva 3 horas por enviar, el siguiente aviso al host lo recuerda, una sola vez.
- **Despachador**: QStash llama cada 5 min a `/api/cron/dispatch` (firmado); los 5 min son la frecuencia de la revisión, no de los emails. Reúne lo que acaba de pasar a "por enviar" y lo que sigue sin enviar tras 3 h y, solo si hay algo, manda un email-resumen al host. Como mucho es un email por mensaje, y los que coinciden a la misma hora van juntos. Cada mensaje se marca como avisado antes de mandar el email y se desmarca si el envío falla, para que el reintento de QStash lo repita sin avisar dos veces.

### Tareas

| # | Tarea | Historias |
|---|---|---|
| 3.1 | Esquema: plantillas del host y mensajes por reserva, con migración; email del huésped opcional | 2, 5, 8 |
| 3.2 | Dominio: variables y relleno, hora de envío y estado del mensaje, con tests | 3, 6, 7, 19 |
| 3.3 | Casos de uso: plantillas (estándar, editar, quitar); programar al registrar la reserva; editar, cancelar y marcar enviado | 1, 2, 8 |
| 3.4 | Pantalla: plantillas con horario y vista previa | 2, 3, 19 |
| 3.5 | Ficha de reserva: mensajes con copiar, marcar enviado, editar y cancelar; historial | 5, 8 |
| 3.6 | Panel: sección "Por enviar" | 1, 6, 7 |
| 3.7 | Despachador: endpoint de QStash cada 5 min y email-resumen al host | 4, 6, 7 |

Cada pantalla se revisa en móvil y en modo claro al construirla, sin pasada aparte como la 2.7.

Entre la 3.3 y la 3.4 se rehízo todo el frontend con un sistema de diseño nuevo; las pantallas de esta fase ya se construyen con él (ver [Frontend](#frontend)).

**Hecho cuando:** una reserva nueva programa sola sus mensajes y, cuando toca cada uno, el host recibe el aviso con el texto listo para pegar en Airbnb, sin redactar nada a mano.

## Fase 4 — Cierre de bucles y validación real ✅ Hecha

Cambios respecto al plan: la 4.5 (una reserva completa con un host real) se sustituyó, por decisión del host, por una prueba end-to-end del sistema completo el 24 de septiembre de 2026: una réplica aislada con el mismo código y las migraciones reales sobre Postgres, manejada con un navegador real en móvil y escritorio, y el despachador probado con una línea temporal simulada (avisos, recordatorio a las 3 h, aviso de preparación con las reglas de 24 h y cambio de huésped, fallo y reintento de Resend, métricas). Resultado: 90 de 91 comprobaciones; los hallazgos que quedan abiertos están en [Pendientes](#pendientes).

Historia 13 (aviso si la checklist no está lista antes del check-in) va aquí a propósito: es la única historia que depende de que **ambos** módulos (housekeeping y messaging) ya existan — implementarla antes obligaría a un atajo temporal que luego se tira. Esta fase también es la de pulido y la primera validación con un host real operando el sistema.

- Aviso al host cuando una reserva está por empezar y la checklist no está completa.
- Ajustes de UX basados en el primer uso real.
- Primeras métricas: tiempo de respuesta, incidencias, estado general del sistema en producción.

### Decisiones

- **El aviso llega cuando ya se puede preparar el piso**: 24 h antes de la hora de llegada o, si el huésped anterior del mismo piso sale más tarde, a la hora de su salida. Con cambio de huésped el mismo día (sale Ana a las 11:00, llega Pedro a las 15:00) el aviso llega a las 11:00; con el piso vacío el día antes, 24 h antes. Una reserva registrada con menos margen se avisa en el siguiente despacho.
- **Solo si hace falta y una sola vez**: si la lista no está completa (o el piso no tiene lista) en ese momento. Se guarda cuándo se avisó (`prep_warned_at` en la reserva), con el mismo marcar-antes-de-enviar que los mensajes.
- **Por el mismo email-resumen** del despachador, junto a los mensajes por enviar, con enlace a la pantalla de preparar. El panel ya muestra "Por preparar esta semana".
- **Métricas en `/estado`**, calculadas de lo que ya se guarda:
  - *Tiempo de respuesta*: de que un mensaje toca a que se marca enviado, mediana y el más lento de los últimos 30 días. Mide lo que el host declara, no la entrega en Airbnb.
  - *Llegadas con el piso sin terminar*: la hora de llegada pasó sin la lista completa (cada tarea marcada guarda su hora).
  - *Despachador activo*: `/estado` pregunta a QStash si el horario de 5 min existe y no está pausado, en vez de mirar solo que haya clave.

### Tareas

| # | Tarea | Historias |
|---|---|---|
| 4.1 | Esquema: `prep_warned_at` en la reserva, con migración | 13 |
| 4.2 | Dominio: momento del aviso (24 h antes o salida del anterior) y a quién avisar, con tests | 13 |
| 4.3 | Despachador: aviso de preparación en el email-resumen, una vez por llegada | 13 |
| 4.4 | Métricas en `/estado`: tiempo de respuesta, llegadas sin terminar y despachador activo | — |
| 4.5 | Uso real: una reserva completa con un host real y los ajustes que salgan | — |

**Hecho cuando:** un host real usa el sistema en una reserva completa (check-in a check-out) sin intervención manual fuera de lo que el diseño ya prevé.

## Fase 5 — Enlace del huésped ✅ Hecha

Cambios respecto al plan: la 5.6 y la 5.7 (vistas del huésped) empezaron como una versión provisional y, tras verla, el host las definió como una guía completa del piso que edita desde su propia pantalla: se añadieron las tareas 5.9 a la 5.15 ([Guía del huésped](#guía-del-huésped-contenido-de-la-56-y-la-57)). Probado en la réplica (enlace 33/33, guía 38/38, sin regresiones en la prueba general) y revisado por el host desde un enlace real en producción; quedan pequeñas mejoras de frontend, en [Pendientes](#pendientes).

**En producción desde el 25 de septiembre de 2026**, activada en este orden (el mismo que hace falta si se repite en otro entorno):
1. `npm run db:migrate` (migraciones `0006` y `0007`) **antes** de desplegar: el código nuevo lee las columnas de la guía.
2. `npm run cargar:bosque`: borró los 3 pisos de prueba con sus 8 reservas y creó Bosque apartment con 8 tareas de preparación y 14 lugares cercanos.
3. Push a `main` (despliegue en Vercel).
4. En Vercel, Storage → Blob store **público** conectado al proyecto, marcando "Add a read-write token env var" (crea `BLOB_READ_WRITE_TOKEN`; el prefijo se deja en `BLOB`), y Redeploy. Sin ese token todo funciona salvo subir fotos.

El enlace usa `APP_URL` si está definida y, si no, el dominio de producción que da Vercel.

Sin historias en `SPEC.md`: nace después del plan original. En vez de repartir la información de la estancia entre varios mensajes, la bienvenida lleva un enlace a una página personal del huésped con todo lo que necesita. Depende de la Fase 1 (reserva y piso) y de la Fase 3 (la bienvenida que lleva el enlace). El token pertenece a la reserva, así que vive en el módulo `reservation`; la página queda fuera del área del host y no pide login.

### Decisiones

- **Un enlace por reserva**: `/estancia/<token>`. El token es de la reserva, no del piso: el enlace de Pepito siempre lleva a la estancia de Pepito, aunque mañana llegue Carlos al mismo piso. Cada reserva nace con uno distinto, que genera la BD como valor por defecto aleatorio de la columna; la migración da uno a las reservas que ya existen.
- **El enlace es la llave.** El huésped no inicia sesión y no se guarda nada en su navegador: quien tiene el enlace ve la estancia. Que lo reenvíe a sus acompañantes se acepta. El token se guarda tal cual, sin hash: la BD ya guarda en claro los datos que protege (código de acceso, wifi).
- **Todo visible desde que recibe el enlace**: dirección, horarios, cómo entrar, wifi y clave, desde que se registra la reserva hasta la hora de salida.
- **Caducidad derivada, no guardada**, como el estado de la reserva. Hasta la hora de salida (fecha de salida más hora de salida del piso, en hora de Colombia) el enlace muestra la estancia; desde ese momento, el mismo enlace solo muestra el agradecimiento. No hay cron que borre tokens.
- **Tras el check-out, agradecimiento e invitación a la reseña**: personalizada con su nombre, llamativa y pensada para que deje la reseña desde la app de Airbnb. No muestra nada que dé acceso al piso (dirección, código, wifi).
- **Nunca se muestran** la bitácora, el email ni el teléfono del huésped, ni datos de otras reservas.
- **Enlace inválido = 404**, sin distinguir el motivo: token inventado, reserva cancelada o token regenerado. Así no se puede averiguar si un token existió.
- **Regenerar desde la ficha de la reserva**, en dos pasos: la reserva recibe un token nuevo y el anterior deja de funcionar al instante, porque solo existe el token actual. El enlace nuevo hay que mandarlo otra vez por Airbnb: la bienvenida ya enviada lleva el viejo.
- **El enlace viaja en la bienvenida**, por el chat de Airbnb (ADR-006 no cambia). Nueva variable `{enlace}` en las plantillas, y la Bienvenida estándar la incluye. La plantilla que el host ya tiene guardada no cambia sola: se añade `{enlace}` desde `/mensajes`, y como los mensajes pendientes se rellenan con la plantilla actual, también lo llevarán las bienvenidas aún sin enviar. Los otros tres mensajes siguen igual.
- **La ficha de la reserva siempre muestra el enlace** para copiarlo: una reserva registrada con la estancia ya empezada no programa bienvenida.
- **Fuera de los buscadores y sin filtrar el token**: la página no se indexa y no manda el token en el `Referer` al pulsar un enlace externo (mapa, Airbnb).
- **El contenido y el diseño de las vistas del huésped los define el host a medida que avance la fase**; esta fase fija el comportamiento, no la maquetación.

### Tareas

| # | Tarea | Historias |
|---|---|---|
| 5.1 | ADR-007: enlace del huésped con token, frente a una cuenta para el huésped o datos sueltos en el mensaje | — |
| 5.2 | Esquema: token único y aleatorio en la reserva, con migración que rellena las existentes | — |
| 5.3 | Casos de uso: buscar la estancia por token (solo los datos permitidos) y regenerar el token; qué vista toca según la hora, con tests | — |
| 5.4 | Plantillas: variable `{enlace}` con la URL completa, y Bienvenida estándar que la incluye | — |
| 5.5 | Ficha de reserva: enlace del huésped con copiar y regenerar en dos pasos | — |
| 5.6 | Vista de la estancia (`/estancia/<token>`), con el contenido que defina el host | — |
| 5.7 | Vista de agradecimiento tras el check-out, con la invitación a dejar la reseña desde la app de Airbnb | — |
| 5.8 | `npm run check`: un token inventado da 404 en producción | — |

Cada pantalla se revisa en móvil y en modo claro al construirla.

### Guía del huésped (contenido de la 5.6 y la 5.7)

Definido por el host después de ver las vistas provisionales: la página del huésped es una guía completa del piso, con la estética de la app, y el host la edita desde una pantalla propia.

- **La guía es del piso**, no de la reserva: lo que el host guarda la ven todos los huéspedes de ese piso; cada uno con su saludo, sus fechas y su enlace.
- **Contenido**: fotos (con portada), mapa con la ubicación exacta, internet y clave, canales de TV, cómo llegar y cómo entrar, normas de la casa, cómo funciona la casa, qué hay en el apartamento, basura y reciclaje, antes de irte, emergencias, transporte y lugares de interés cercanos (con "Cómo llegar" en Google Maps).
- **Mapa**: OpenStreetMap incrustado (sin claves ni coste) y botón para abrir la ubicación en Google Maps. El host da la ubicación con coordenadas o pegando un enlace de Google Maps.
- **Fotos en Vercel Blob** (ADR-008). Se comprimen en el navegador antes de subir (lado largo de 1600 px) y suben de una en una; la primera es la portada.
- **Agradecimiento llamativo**: portada del piso, estrellas que caen y los pasos para dejar la reseña desde la app de Airbnb, con botón que la abre.
- **Pantalla del host "Guía"** en la navegación: un piso por tecla y, dentro, el editor por secciones con vista previa de lo que ve el huésped.
- **Datos iniciales reales**: se borran los pisos de prueba (y con ellos sus reservas) y se crea **Bosque apartment** (Bosque Central, piso 1, apto 111, El Bosque, Floridablanca) con lugares cercanos reales de OpenStreetMap. Internet, TV y normas van inventados hasta que el host los corrija.

| # | Tarea | Historias |
|---|---|---|
| 5.9 | ADR-008: fotos en Vercel Blob | — |
| 5.10 | Esquema: campos de la guía en el piso, fotos y lugares cercanos, con migración | — |
| 5.11 | Dominio: ubicación a partir de coordenadas o enlace de Google Maps, listas por líneas y validación de la guía, con tests | — |
| 5.12 | Casos de uso: guía del piso, fotos (subir, ordenar, portada, quitar) y lugares (añadir, quitar) | — |
| 5.13 | Pantalla del host "Guía": editor por secciones y vista previa | — |
| 5.14 | Vista del huésped con la guía completa y agradecimiento llamativo | — |
| 5.15 | Script de carga: borra los pisos de prueba y crea Bosque apartment | — |

**Hecho cuando:** el huésped abre el enlace de su bienvenida y ve su estancia sin iniciar sesión; desde su hora de salida, el mismo enlace solo le agradece e invita a la reseña; el siguiente huésped del mismo piso recibe otro enlace; y al regenerar, el enlace anterior deja de funcionar al instante.

## Pendientes

Lo que queda abierto después de la Fase 5, sin fase asignada todavía.

**Mejoras de frontend de la guía del huésped**
- Pequeños ajustes visuales que el host irá definiendo tras revisarla en producción.

**Hallazgos de la prueba end-to-end** (informe del 24 de septiembre de 2026)
- **Login con un email no autorizado** (importancia media): muestra el error genérico de Next ("This page couldn't load") en vez de "Este email no tiene acceso". `signIn` lanza `AuthError` (`AccessDenied`) sin capturar en `src/app/login/page.tsx`. Arreglo: capturar el `AuthError` y redirigir a `/login/error?error=<tipo>`, dejando pasar el redirect de éxito.
- **Doble punto en el email-resumen** (baja): "Toca desde el viernes, 25 de septiembre, 10:00 a. m..", en la línea "Toca desde…" de `src/domain/messaging/digest.ts`. Arreglo: no añadir el punto si la hora ya acaba en punto, con un caso en `digest.test.ts`.
- **Firma de QStash inválida → 500 en vez de 403** (informativo): el despacho no se ejecuta; solo ensucia los logs. Opcional: capturar `SignatureError` y responder 403.

**Datos y comprobaciones**
- Sustituir los datos de ejemplo de Bosque apartment (wifi, TV, código de acceso, normas, basura) por los reales desde "Guía".
- Comprobar que el chat de Airbnb deja pasar el enlace de la bienvenida sin ocultarlo ni marcarlo.
- Confirmar que la Bienvenida guardada en `/mensajes` lleva `{enlace}` (la plantilla que ya existía no cambia sola).
- `/estado`: la lista de fases (`src/app/(host)/estado/page.tsx`) aún muestra la Fase 4 "En curso" y no incluye la Fase 5.

**Fuera de plan desde la Fase 1**
- Importar reservas desde el calendario iCal de Airbnb.

## Frontend

### Rediseño (entre la 3.3 y la 3.4)

Todo el frontend se rehízo tomando como referencia la estética, las animaciones y la UX de [gitbybit.com](https://gitbybit.com/): se toma su estilo, no su marca, textos ni código. Sustituye al diseño "llavero" de las fases 1 y 2 (etiquetas de llave colgadas y piezas de papel).

- **Base**: fondo con rejilla de puntos, casi negro en oscuro y gris claro en claro. Los dos modos salen de las mismas variables con `light-dark()`.
- **Tipografía**: Chakra Petch para títulos, botones y navegación; Shantell Sans para las notas escritas a mano; la fuente del sistema para el texto.
- **Color con significado**: rojo de marca para el logo, la sección activa y lo destructivo; azul para la acción principal; amarillo para las tareas del host; verde para lo hecho o libre.
- **Componentes**:
  - Cabecera que cuelga del borde superior, con esquinas en chaflán.
  - Teclas 3D que se levantan al pasar por encima y se hunden al pulsar: botones, navegación y casillero. La acción principal de cada pantalla va inclinada y con un destello cada pocos segundos.
  - Títulos con una palabra enmarcada en un paralelogramo ("Libro de *huéspedes*").
  - Tarjetas amarillas de tarea para lo que el host tiene que hacer.
  - Recorrido de círculos unidos por una línea para la preparación, la bitácora y las fases.
  - Celdas por día en la agenda, la ficha de la reserva con marco en degradado y notas a mano con flecha.
- **Casillero como teclado**: cada piso es una tecla. Arriba significa libre, hundida significa que el huésped tiene la llave y amarilla significa que llega alguien hoy.
- **Animaciones**:
  - La cabecera entra desde arriba y las letras del logo saltan al pasar el ratón.
  - La palabra enmarcada del título cae al cargar.
  - La casilla marcada salta y suelta un anillo, y el sello "Listo para…" cae con destellos.
  - Los errores de formulario sacuden el campo.
- **Preferencias del host**: en la cabecera, la bombilla cambia entre claro y oscuro, y el destello apaga o enciende las animaciones. Se guardan en el navegador y se aplican antes de pintar, sin parpadeo. También se respeta "reducir movimiento" del sistema.
- **Dónde vive**: todo el estilo en `src/app/globals.css`; las piezas compartidas en `src/app/_components/` (`wordmark`, `preferences`, `hand-note`, `entry`, `icons`, `nav-link`, `field`, `submit-button`).
- **Comprobado**: todas las pantallas en claro y oscuro, en móvil y escritorio, sin scroll horizontal a 320 y 360 px.

### Guía del huésped (Fase 5)

La página pública del huésped usa el mismo sistema de diseño que el área del host, con piezas propias:

- **Cabecera colgante** con el nombre del piso como logo (letras que saltan) y la bombilla y el destello del tema, sin la navegación del host.
- **Arriba**: título con el nombre del huésped enmarcado, isla de cifras (llegada, salida, noches, huéspedes) y la portada con marco en degradado, al lado en escritorio y debajo en móvil.
- **Atajos** a cada sección con las mismas teclas de la navegación; solo aparecen las secciones con datos.
- **Secciones**: galería deslizable, tecla grande del wifi con "Copiar clave", mapa de OpenStreetMap enmarcado, normas en recorrido de círculos, lo que hay en el apartamento como etiquetas, lugares cercanos en tarjetas por tipo con "Cómo llegar", "Antes de irte" en tarjeta amarilla y emergencias con "Llamar al 123".
- **Agradecimiento**: estrellas amarillas que caen una a una, la portada como polaroid inclinada y los pasos para la reseña en recorrido, con el botón inclinado a Airbnb.
- **Cabecera del host con cinco teclas** (se añadió "Guía"): en móvil las teclas encogen su relleno y su letra para caber a 320 px.
- **Dónde vive**: las vistas en `src/app/estancia/` (`guest-guide`, `guest-thanks`, `copy-button`); el editor en `src/app/(host)/guia/`; los estilos en `globals.css`, secciones "Guía del huésped" y "Editor de la guía".
- **Comprobado**: guía y agradecimiento en claro y oscuro, a 320, 390 y 1280 px, sin scroll horizontal; la cabecera del host a 320, 360 y 390 px.

### Vistas

| Ruta | Vista | Qué muestra |
|---|---|---|
| `/login` | Acceso | Email del host y botón para recibir el enlace de acceso (sin contraseña). |
| `/login/revisa` | Enlace enviado | Aviso de que el enlace va en camino y de que solo sirve una vez. |
| `/login/error` | Error de acceso | Enlace ya usado o caducado, email sin acceso o fallo genérico, con botón para pedir otro. |
| `/panel` | Llegadas | Fecha de hoy con cifras (llegan, salen, pisos ocupados, por preparar), tarjeta "Por enviar" con los mensajes que ya tocan (cada uno lleva a su texto en la ficha de la reserva), tarjeta "Por preparar esta semana", casillero de teclas por piso y agenda de los próximos 7 días. |
| `/reservas` | Libro de huéspedes | Reservas próximas y en curso, e historial de terminadas y canceladas, con su estado. |
| `/reservas/nueva` | Registrar reserva | Piso y fechas con resumen de la estancia, datos del huésped (email y teléfono opcionales). Acepta `?piso=` para preseleccionar. |
| `/reservas/[id]` | Ficha de la reserva | Estancia y contacto, tarjeta de preparación del piso, mensajes, bitácora de notas y cancelación en dos pasos. Los mensajes van en recorrido por hora de envío: el que está por enviar brilla en amarillo, los enviados llevan su check y el texto exacto que se pegó, y los cancelados quedan tachados. Los pendientes se copian, se marcan enviados, se editan (el texto queda fijo y lleva la marca "Editado") o se dejan sin enviar tras confirmar; si falta un dato del piso, avisa y enlaza al piso. |
| `/reservas/[id]/preparar` | Preparar la llegada | Pensada para móvil: progreso fijo arriba y tareas que se guardan al tocarlas; sello "Listo para…" al completarlas. |
| `/pisos` | Tus pisos | Una tecla por piso con dirección y horarios. |
| `/pisos/nuevo` | Añadir piso | Formulario con vista previa en vivo de "Así lo verá tu huésped". |
| `/pisos/[id]` | Editar piso | El mismo formulario y la lista de preparación del piso (añadir, renombrar, quitar tareas). |
| `/mensajes` | Tus plantillas | Recorrido de las plantillas en el orden en que se envían, con su momento y el texto con las variables resaltadas. Sin plantillas: tarjeta para crear las cuatro estándar o escribir una desde cero. |
| `/mensajes/nueva` | Nueva plantilla | Nombre, texto con teclas para insertar variables y cuándo toca (al registrar, o día y hora respecto a la llegada o la salida). Al lado, la vista previa como globo de chat con una reserva de ejemplo y los datos de un piso, el momento del aviso y qué datos faltan en el piso. |
| `/mensajes/[id]` | Editar plantilla | El mismo formulario, avisando de que el horario vale para reservas nuevas y el texto también para las ya programadas; quitar en dos pasos. |
| `/estado` | Estado del sistema | Acceso, base de datos, correo y avisos comprobados en el momento (los avisos, preguntando a QStash si el horario existe y corre); métricas de los últimos 30 días (tiempo de respuesta, mediana y el más lento, y llegadas con el piso sin terminar), y el avance por fases. |
| `/guia` | La guía del huésped | Una tecla por piso para editar su guía. |
| `/guia/[id]` | Editar la guía | Fotos (subir, portada, ordenar, quitar), la información por secciones (ubicación, wifi y TV, llegar y entrar, la casa, salida, ayuda) y los lugares cercanos; botón "Ver como huésped". |
| `/vista-previa/[id]` | Vista previa | La guía como la ve un huésped de ejemplo, solo para el host. |
| `/estancia/[token]` | Guía del huésped (pública) | Saludo y cifras de la estancia, portada, atajos a cada sección, galería, wifi con clave para copiar, TV, mapa de OpenStreetMap y botón a Google Maps, normas, cómo funciona la casa, qué hay, basura, lugares cercanos por tipo con "Cómo llegar", "Antes de irte", transporte y emergencias (llamar al 123). Tras la salida, agradecimiento con estrellas, la portada en polaroid y los pasos para dejar la reseña en la app de Airbnb. Enlace que no vale: 404 propio. |
| cualquier otra | 404 | "Esta llave no abre ninguna puerta", con vuelta al panel. |
