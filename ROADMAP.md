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

Cambios respecto al plan: las plantillas tienen sección propia (`/mensajes`) en la navegación. El email-resumen va en texto plano, para copiar cada mensaje tal cual, y enlaza a cada uno en la ficha de la reserva. El horario de QStash se crea con `npm run schedule` (id fijo `dispatch`: volver a ejecutarlo lo actualiza), y `npm run check` comprueba que el despachador exige firma. Al rellenar, un dato que acaba en punto ya no deja dos seguidos ("p. m.."). **Para activarla en producción**: desplegar y ejecutar `npm run schedule` una vez.

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

## Fase 4 — Cierre de bucles y validación real

Historia 13 (aviso si la checklist no está lista antes del check-in) va aquí a propósito: es la única historia que depende de que **ambos** módulos (housekeeping y messaging) ya existan — implementarla antes obligaría a un atajo temporal que luego se tira. Esta fase también es la de pulido y la primera validación con un host real operando el sistema.

- Aviso al host cuando una reserva está por empezar y la checklist no está completa.
- Ajustes de UX basados en el primer uso real.
- Primeras métricas: tiempo de respuesta, incidencias, estado general del sistema en producción.

**Hecho cuando:** un host real usa el sistema en una reserva completa (check-in a check-out) sin intervención manual fuera de lo que el diseño ya prevé.

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
| `/estado` | Estado del sistema | Acceso, base de datos, correo y recordatorios comprobados en el momento, y el avance por fases. |
| cualquier otra | 404 | "Esta llave no abre ninguna puerta", con vuelta al panel. |
