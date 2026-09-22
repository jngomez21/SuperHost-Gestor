# ADR-003: PostgreSQL vs. NoSQL

## Contexto

El dominio tiene relaciones claras y consultadas con frecuencia: una reserva pertenece a una propiedad, tiene tareas de checklist asociadas, tiene mensajes programados asociados, y transiciona entre estados definidos. Se necesita consistencia (una reserva no debería quedar en un estado inválido) e integridad referencial (no perder tareas o mensajes huérfanos).

## Opciones consideradas

1. **PostgreSQL** (relacional).
2. **Base de datos documental** (ej. MongoDB) — esquema flexible, sin joins nativos.
3. **SQLite** — relacional también, pero pensado para un único proceso/archivo, más limitado para despliegue en la nube con acceso concurrente.

## Decisión

PostgreSQL (opción 1), accedido vía **Drizzle ORM** para evitar SQL repetitivo sin adoptar una capa más pesada de lo necesario.

Se evaluó Prisma primero por ser la opción por defecto del ecosistema, pero al intentar usarlo (fase 0 de implementación, septiembre 2026) se comprobó que su CLI actual ya no es solo un ORM: es la "Prisma Developer Platform", con su propio hosting de Postgres, su propio despliegue y sus propios buckets — el mismo patrón de "todo en un proveedor" que esta spec evita deliberadamente (ver ADR-005). Drizzle es solo una capa de esquema/queries tipadas sobre el driver de Postgres, sin plataforma propia.

Esta ADR cubre la elección de **motor de base de datos**. La elección de **quién lo aloja** (proveedor gestionado) es una decisión aparte — ver [ADR-005](0005-proveedor-hosting-datos.md).

## Consecuencias

**Positivas**
- Relaciones e integridad referencial modeladas de forma nativa (foreign keys), en vez de reimplementarlas a mano.
- Transiciones de estado de reserva y consultas del panel ("reservas con checklist pendiente") se expresan como consultas relacionales simples.
- Amplia disponibilidad de hosting gestionado (Neon, Supabase, RDS) con coste bajo para el volumen esperado.

**Negativas**
- Requiere definir un esquema por adelantado (migraciones), algo más rígido que un documento sin esquema — aceptable porque el dominio ya está bien definido en `SPEC.md`.

**Riesgos**
- Ninguno relevante al volumen actual.
