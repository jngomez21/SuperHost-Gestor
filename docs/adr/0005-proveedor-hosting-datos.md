# ADR-005: Proveedor de base de datos/auth — Supabase vs. Neon vs. PocketBase

## Contexto

`ADR-003` fija PostgreSQL como motor. Falta decidir quién lo aloja y de dónde salen auth y cron, dado un requisito concreto: el desarrollador va a trabajar desde dos PCs distintos en ubicaciones distintas, por lo que el acceso a los datos y a la lógica de negocio debe funcionar desde cualquiera de los dos sin pasos manuales de sincronización.

En septiembre de 2026 se verificó el estado de Supabase (fuente principal candidata por venir con Postgres + Auth + cron en un solo paquete): tiene un outage parcial activo en su API Gateway desde el 14 de agosto de 2026 (errores 401 por rechazo de JWT, fix aún en pruebas internas) y reporta 18 outages en los últimos 30 días across 24 componentes. Su free tier además pausa proyectos tras 7 días de inactividad y no incluye backups.

## Opciones consideradas

1. **Supabase** — Postgres + Auth + Storage + cron (`pg_cron`) en una sola plataforma gestionada.
2. **Neon + piezas separadas** — Postgres gestionado "neutro" (sin auth ni cron incluidos), añadiendo Auth.js (librería, corre dentro de la propia app) para login del host y un servicio de cron externo (ver ADR-004) para los disparos programados.
3. **PocketBase autoalojado** — binario único con SQLite + Auth + cron embebidos, pero solo accesible desde donde se despliegue; para acceso multi-PC/multi-ubicación exige montar y mantener un servidor propio siempre encendido (VPS), lo que reintroduce trabajo de administración de infraestructura.

## Decisión

Neon (Postgres gestionado) + Auth.js para autenticación (opción 2).

Razones, en orden de peso:
- **Requisito de multi-ubicación**: Neon es accesible por red desde cualquier PC con la connection string, sin ningún paso adicional. PocketBase solo lo logra si se despliega en un servidor remoto propio — trabajo de ops que Neon no requiere.
- **Fiabilidad actual**: Supabase tiene incidentes activos y un historial reciente de outages frecuentes (verificado en esta misma decisión, no es una suposición). El producto depende de que los mensajes/avisos se disparen a tiempo — la disponibilidad de la capa de datos es crítica para su propuesta de valor, así que no se justifica asumir ese riesgo por la comodidad de tener auth/cron incluidos.
- **Sin lock-in de plataforma**: Neon es Postgres estándar; el dump se porta a cualquier otro proveedor de Postgres sin reescribir nada de auth o lógica.

## Consecuencias

**Positivas**
- Acceso a los datos idéntico desde cualquier PC/ubicación, sin infraestructura propia que mantener.
- No depende de la disponibilidad de Supabase mientras esta atraviesa problemas operativos activos.
- Backups gestionados por Neon (a diferencia del free tier de Supabase, que no los incluye).

**Negativas**
- Auth y cron no vienen incluidos — hay que integrarlos como piezas propias (Auth.js en el código de la app; cron externo, ver ADR-004). Es código adicional que Supabase habría evitado, pero acotado y bien documentado (Auth.js es una librería estándar del ecosistema Next.js, no una construcción desde cero).

**Riesgos**
- Ninguno relevante al volumen actual. Se revisa si Neon presentara un patrón de incidentes similar al detectado en Supabase — la elección se basa en el estado verificado en el momento de esta decisión (septiembre 2026), no en una garantía permanente.
