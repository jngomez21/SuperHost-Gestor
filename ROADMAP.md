# Roadmap

Basado en `SPEC.md` (historias de usuario) y `ARCHITECTURE.md` (módulos de dominio y ADRs). Las fases siguen las dependencias reales entre módulos (`property` → `reservation` → `housekeeping`/`messaging`), no un orden arbitrario de prioridad de negocio. Cada fase, al cerrarse, deja algo funcionando de punta a punta — ninguna depende de rehacer trabajo de una fase anterior.

## Fase 0 — Fundaciones técnicas (walking skeleton)

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

## Fase 1 — Núcleo: Propiedades y Reservas

Historias 14, 15, 16, 17, 18. Módulo del que dependen `housekeeping` y `messaging`. Se elige primero porque nada más puede construirse sin él.

- Alta de propiedades (dirección, wifi, instrucciones de acceso).
- Alta manual de reservas (huésped, fechas, propiedad).
- Transición automática de estados de reserva según hitos temporales.
- Notas/incidencias por reserva.
- Panel con todas las reservas próximas y su estado.

**Hecho cuando:** el host puede dar de alta un piso, registrar una reserva y ver su estado en el panel, sin nada automatizado todavía.

## Fase 2 — Checklist de preparación

Historias 9, 10, 11, 12. Depende solo de la Fase 1. Va antes que mensajería porque es la pieza más simple de las dos que faltan (CRUD + estado, sin proveedores externos ni disparo por tiempo) — valida que el modelo de reserva aguanta antes de meter la complejidad de QStash/Resend.

- Checklist estándar de tareas por propiedad.
- Marcar tareas completadas por reserva.
- Vista de reservas con preparación pendiente.
- Personalización de la checklist por propiedad.

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
