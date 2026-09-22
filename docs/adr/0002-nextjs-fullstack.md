# ADR-002: Next.js full-stack vs. backend + frontend separados

## Contexto

El MVP necesita un panel para el host (reservas, checklist, plantillas) y una capa de backend (casos de uso, acceso a datos, disparo de mensajes). `SPEC.md` dejaba esta elección pendiente. Un solo desarrollador, sin necesidad de que frontend y backend escalen ni se desplieguen de forma independiente.

## Opciones consideradas

1. **Backend API (REST) + frontend SPA separado** — dos proyectos, dos despliegues, contrato de API versionado entre ambos.
2. **Framework full-stack (Next.js)** — un proyecto, UI y backend (route handlers/server actions) en el mismo repo y despliegue.
3. **Backend a medida sin framework** (ej. Express + frontend estático) — máximo control, más código propio para lo que un framework ya resuelve (routing, build, server-side rendering).

## Decisión

Next.js full-stack (opción 2).

## Consecuencias

**Positivas**
- Un solo repo, un solo despliegue (Vercel u otro host compatible) — menos partes móviles para un desarrollador solo.
- No hay que mantener ni versionar un contrato de API entre dos proyectos separados; los server actions llaman directamente a la capa de aplicación.
- Ecosistema y tooling maduros (auth, formularios, despliegue) — evita reinventar piezas que no son el valor diferencial del producto.

**Negativas**
- Acopla frontend y backend al mismo runtime/despliegue. Si en el futuro se necesita un cliente distinto (app móvil nativa) sin pasar por Next.js, hace falta exponer esos mismos casos de uso como API — el límite ya existe en `application/`, así que es exponer, no reescribir.

**Riesgos**
- Ninguno relevante al alcance actual. Se revisa si aparece un segundo cliente (móvil, integraciones de terceros) que no pueda consumir server actions.
