# ADR-006: Canal de los mensajes al huésped

## Contexto

La Fase 3 automatiza los mensajes de bienvenida, llegada, salida y despedida (historias 1-8 y 19). `ARCHITECTURE.md` suponía que el sistema los enviaría al huésped a través de un proveedor de email (Resend). Al planificar la fase (septiembre 2026) aparecieron tres hechos que cambian esa suposición:

- **Airbnb no comparte el email del huésped** con el host; solo su teléfono al confirmar la reserva. La conversación está pensada para ir por el chat de Airbnb, y es ahí donde se mide la tasa de respuesta que cuenta para Superhost.
- **Resend sin dominio propio solo envía a la dirección de la cuenta** (por eso funciona el login por enlace mágico). Escribir a terceros exige verificar un dominio con registros DNS; el subdominio de `vercel.app` no sirve.
- **El sistema no ve la bandeja de Airbnb**, así que no puede saber si un huésped escribió ni si el host respondió (historia 4 tal como está escrita).

## Opciones consideradas

1. **Email directo al huésped** (Resend): totalmente automático, pero requiere dominio propio, conseguir el email de cada huésped fuera de Airbnb y deja la conversación fuera de la plataforma.
2. **Copiar y pegar en Airbnb**: el sistema calcula cuándo toca cada mensaje, lo rellena con los datos de la reserva y el piso, y avisa al host (panel + email a su propia dirección). El host lo pega en el chat de Airbnb y lo marca como enviado.
3. **Ambos**: email cuando haya dominio y email del huésped; copiar y pegar en el resto.

## Decisión

Opción 2, copiar y pegar en Airbnb.

Funciona hoy sin dominio ni datos que Airbnb no da, mantiene la conversación donde se mide la tasa de respuesta y conserva lo valioso del producto: que el host no redacte nada y no se le pase ningún mensaje. La opción 3 duplica caminos que construir y probar para un caso (tener el email del huésped) que casi nunca se da.

La historia 4 se reformula: en vez de vigilar mensajes del huésped que el sistema no ve, se avisa al host si un mensaje que ya tocaba enviar sigue sin marcarse como enviado pasadas unas horas.

## Consecuencias

**Positivas**
- Sin dominio, sin DNS y sin coste: el proveedor de email solo escribe al host.
- El email del huésped deja de ser obligatorio en la reserva.
- El historial de mensajes guarda el texto exacto que el host marcó como enviado.

**Negativas**
- El envío tiene un paso manual (pegar y marcar). Si el host no lo hace, el mensaje no llega; lo mitiga el recordatorio de pendientes.
- "Enviado" es lo que el host declara, no una confirmación de entrega.

**Riesgos y ceiling**
- `ponytail: canal manual vía Airbnb — si aparece un canal con API (dominio propio para email, WhatsApp Business) o integración con Airbnb, se añade un envío automático detrás del mismo "por enviar", sin cambiar plantillas ni programación.`
