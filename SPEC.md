# Gestor de Check-in/Check-out para Hosts Nuevos de Airbnb

## Problem Statement

Un host nuevo en Airbnb compite en desventaja: sin historial ni reseñas, el algoritmo de búsqueda lo penaliza, y el estatus Superhost depende de métricas (tasa de respuesta, tasa de cancelación, valoración ≥4.8, estancias sin incidencias) que se ganan o se pierden en los primeros meses. En esa etapa, toda la operación recae en procesos manuales — mensajes escritos uno por uno, listas de limpieza recordadas de memoria, instrucciones del piso repetidas cada vez — y cualquier fallo ahí (respuesta tardía, llave que no funciona, duda sin resolver) se traduce en una mala reseña que pesa desproporcionadamente cuando aún no hay historial que la compense.

## Solution

Una herramienta que estandariza y agiliza todo lo que ocurre alrededor de la llegada y salida de cada huésped: comunicación consistente, preparación del piso con proceso repetible, y seguimiento del estado de cada reserva. No gestiona precios ni reservas en sí — es el soporte operativo de la experiencia del huésped, que es el terreno donde se gana o se pierde el camino hacia Superhost. El objetivo es que un host sin trayectoria se comporte, desde su primera reserva, como un Superhost experimentado.

## User Stories

### Comunicación con el huésped

1. Como host nuevo, quiero enviar automáticamente un mensaje de bienvenida al confirmarse la reserva, para que el huésped tenga la información básica (wifi, cómo entra, normas) sin tener que preguntar.
2. Como host nuevo, quiero definir plantillas de mensaje reutilizables (bienvenida, recordatorio de check-in, instrucciones de check-out, despedida), para no redactar el mismo texto reserva tras reserva.
3. Como host nuevo, quiero que las plantillas admitan variables (nombre del huésped, fecha de entrada, código de acceso), para que cada mensaje se sienta personalizado sin esfuerzo manual.
4. Como host nuevo, quiero que se me recuerde responder a un mensaje del huésped si ha pasado demasiado tiempo sin respuesta, para proteger mi tasa de respuesta.
5. Como host nuevo, quiero ver un historial de todos los mensajes enviados a un huésped en una reserva concreta, para no perder el contexto de la conversación.
6. Como host nuevo, quiero que se dispare automáticamente el mensaje de "instrucciones de check-in" un tiempo configurable antes de la llegada, para que el huésped llegue sin dudas.
7. Como host nuevo, quiero que se dispare automáticamente un mensaje de "recordatorio de check-out" antes de la salida, para reducir salidas tardías o incidencias de última hora.
8. Como host nuevo, quiero poder editar o cancelar un mensaje programado antes de que se envíe, para corregir errores o adaptarme a cambios de última hora.

### Preparación y limpieza del piso

9. Como host nuevo, quiero una checklist estándar de tareas de limpieza/preparación por piso, para no depender de la memoria y no olvidar ningún paso.
10. Como host nuevo, quiero poder marcar cada tarea de la checklist como completada para una reserva concreta, para tener constancia de que el piso quedó listo.
11. Como host nuevo, quiero ver de un vistazo qué reservas tienen el piso pendiente de preparar antes del check-in, para priorizar mi tiempo.
12. Como host nuevo, quiero poder personalizar la checklist por propiedad (si tengo más de un piso), para reflejar diferencias reales entre alojamientos.
13. Como host nuevo, quiero recibir un aviso si una reserva está a punto de empezar y la checklist de preparación no está completa, para evitar recibir a un huésped con el piso sin terminar.

### Seguimiento del estado de la reserva

14. Como host nuevo, quiero ver un panel con todas las reservas próximas y su estado (pendiente de preparar, lista, huésped en casa, pendiente de check-out), para tener visibilidad global sin entrar reserva por reserva.
15. Como host nuevo, quiero registrar manualmente una reserva (huésped, fechas, propiedad) si no llega integrada automáticamente desde Airbnb, para poder usar la herramienta desde el día uno aunque no haya integración completa.
16. Como host nuevo, quiero que cada reserva pase automáticamente de un estado a otro según hitos temporales (ej. de "próxima" a "en curso" el día de entrada), para no tener que actualizar el estado a mano.
17. Como host nuevo, quiero anotar incidencias o notas sobre una reserva concreta (ej. "huésped pidió llegada tardía"), para tener contexto disponible la próxima vez que interactúe con esa reserva.

### Configuración y gestión de propiedades

18. Como host nuevo, quiero dar de alta una o varias propiedades con sus datos básicos (dirección, wifi, instrucciones de acceso), para reutilizar esa información en plantillas y checklists.
19. Como host nuevo, quiero configurar los tiempos de disparo de cada mensaje automático (ej. "24h antes del check-in"), para adaptar el flujo a mi forma de operar.

## Implementation Decisions

- **Arquitectura**: sin decidir todavía (greenfield). Esta spec es agnóstica de stack; la elección de arquitectura (web app full-stack vs. backend API + frontend separado) queda como decisión pendiente antes de implementar.
- **Alcance de integración con Airbnb**: la primera iteración no asume integración automática con la API/calendario de Airbnb (no hay garantía de acceso). Las reservas se pueden dar de alta manualmente (historia 15); la integración automática queda como mejora futura.
- **Módulos previstos** (a nivel de dominio, no de archivos):
  - Gestión de Reservas (reservation): datos de huésped, propiedad, fechas, estado.
  - Mensajería (messaging): plantillas, variables, programación y envío de mensajes.
  - Checklist de preparación (housekeeping): definición de tareas por propiedad, estado por reserva.
  - Propiedades (property): datos maestros usados por mensajería y checklist.
- **Seam de testing**: pendiente de confirmar junto con la arquitectura. Recomendación: exponer un único seam de dominio (ej. capa de "casos de uso"/servicios de aplicación) que orqueste reservation, messaging y housekeeping, de forma que los tests puedan ejercitar el comportamiento completo (crear reserva → dispara checklist → dispara mensajes) sin acoplarse a la UI ni a la infraestructura (BD, proveedor de email/SMS).

## Testing Decisions

- Los tests deben verificar comportamiento observable (p. ej. "al llegar la fecha de disparo, se genera un mensaje de check-in con las variables correctas"), no detalles de implementación internos.
- Módulos a testear prioritariamente: transición de estados de reserva, generación de mensajes a partir de plantillas + variables, y el disparo de la checklist de preparación ante una reserva próxima.
- No hay prior art en el repo (proyecto sin código todavía); el patrón de test se establecerá con el primer módulo implementado y se documentará como referencia para los siguientes.

## Out of Scope

- Gestión de precios, disponibilidad o motor de reservas (Airbnb ya lo resuelve).
- Integración automática con la API de Airbnb en la primera iteración.
- Pagos, facturación o contabilidad.
- Soporte multi-idioma de plantillas (se asume un único idioma en el MVP).
- Gestión de equipos de limpieza externos (asignación, turnos) más allá de la checklist básica.

## Further Notes

- El valor central no es "automatizar por automatizar", sino compensar con sistema y consistencia la falta de historial/reputación de un host nuevo, sosteniendo las métricas que determinan el estatus Superhost (tasa de respuesta, valoración, cero incidencias).
- Antes de implementar, quedan dos decisiones abiertas señaladas en este documento: (1) arquitectura/stack del MVP, y (2) seam de testing concreto una vez elegida la arquitectura.
