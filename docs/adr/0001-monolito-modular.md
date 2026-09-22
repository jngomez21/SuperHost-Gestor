# ADR-001: Monolito modular vs. microservicios

## Contexto

El sistema tiene 4 módulos de dominio (`reservation`, `messaging`, `housekeeping`, `property`) que colaboran estrechamente: crear una reserva dispara la checklist de preparación y la programación de mensajes. El proyecto arranca con un único host operando, volumen bajo de reservas, y un equipo de desarrollo de una persona.

## Opciones consideradas

1. **Microservicios** — un servicio desplegable por módulo, comunicados por red (HTTP/eventos).
2. **Monolito modular** — un único desplegable, módulos separados por límites de código (carpetas + interfaces), sin red entre ellos.
3. **Monolito sin modularizar** — todo el código en una capa sin separación de dominios.

## Decisión

Monolito modular (opción 2).

## Consecuencias

**Positivas**
- Un solo despliegue, sin orquestación de red, sin latencia entre módulos que colaboran en el mismo flujo (reserva → checklist → mensaje).
- Los límites de dominio existen desde el día uno (interfaces entre `application/` y cada módulo), así que extraer un módulo a servicio propio en el futuro es un refactor localizado, no una reescritura.
- Coste operativo mínimo, adecuado para un solo desarrollador y un solo host.

**Negativas**
- Todo el sistema escala junto (no se puede escalar `messaging` por separado si en el futuro tuviera picos de carga distintos a `reservation`).
- Un fallo en un módulo puede tumbar el proceso completo (mitigado con manejo de errores por caso de uso, no por aislamiento de proceso).

**Riesgos**
- Ninguno relevante al volumen actual (un host, decenas de reservas). Se revisa esta decisión si el producto pasa a multi-tenant con volumen alto.
