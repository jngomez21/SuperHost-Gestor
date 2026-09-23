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

## Fase 2 — Checklist de preparación

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

## Fase 3 — Mensajería automática

Historias 1-8 y 19. La pieza que protege directamente las métricas de Superhost (tasa de respuesta). Es la más compleja: plantillas + variables + integración con QStash y Resend — se deja para después de validar Fases 1-2 con el modelo de reserva ya probado.

- Plantillas reutilizables con variables (nombre, fechas, código de acceso).
- Disparo automático de mensajes de check-in/check-out según tiempos configurables.
- Edición/cancelación de mensajes programados antes del envío.
- Historial de mensajes por reserva.
- Aviso al host si un mensaje de huésped lleva demasiado tiempo sin respuesta.

**Hecho cuando:** una reserva nueva dispara sola sus mensajes de check-in/check-out sin que el host escriba nada a mano.

## Fase 4 — Cierre de bucles y validación real

Historia 13 (aviso si la checklist no está lista antes del check-in) va aquí a propósito: es la única historia que depende de que **ambos** módulos (housekeeping y messaging) ya existan — implementarla antes obligaría a un atajo temporal que luego se tira. Esta fase también es la de pulido y la primera validación con un host real operando el sistema.

- Aviso al host cuando una reserva está por empezar y la checklist no está completa.
- Ajustes de UX basados en el primer uso real.
- Primeras métricas: tiempo de respuesta, incidencias, estado general del sistema en producción.

**Hecho cuando:** un host real usa el sistema en una reserva completa (check-in a check-out) sin intervención manual fuera de lo que el diseño ya prevé.
