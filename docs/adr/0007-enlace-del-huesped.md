# ADR-007: Enlace del huésped con token

## Contexto

La Fase 5 da a cada huésped una página propia con todo lo de su estancia (dirección, horarios, cómo entrar, wifi), en lugar de repartir esa información entre varios mensajes. La página tiene que abrirse desde el chat de Airbnb (ADR-006 sigue vigente: el sistema no escribe al huésped), mostrar solo la estancia de ese huésped y dejar de mostrarla cuando sale: si Pepito sale hoy y mañana llega Carlos al mismo piso, Pepito no puede ver nada de Carlos.

El sistema no conoce el email del huésped (Airbnb no lo comparte) y el huésped no va a crear una cuenta para una estancia de dos noches.

## Opciones consideradas

1. **Cuenta o login del huésped** (enlace mágico a su email, o código por SMS): identidad fuerte, pero exige un contacto que Airbnb no da y un paso más para el huésped justo al llegar.
2. **Enlace por piso** (`/piso/<id>`), con la información del piso: sencillo, pero el mismo enlace sirve para todos los huéspedes del piso; no se puede personalizar ni caducar sin afectar al siguiente.
3. **Enlace por reserva con un token aleatorio** (`/estancia/<token>`): el enlace es la llave. Cada reserva nace con su token; la página muestra la estancia hasta la hora de salida y, desde entonces, solo un agradecimiento.

## Decisión

Opción 3, enlace por reserva con token.

- **El token es de la reserva**, no del piso: el enlace de un huésped nunca muestra otra estancia. Es un UUID aleatorio (122 bits) que genera la BD como valor por defecto de la columna, único; la migración da uno a las reservas que ya existían.
- **La caducidad se deriva de la hora de salida**, como el estado de la reserva: no hay columna de expiración ni cron que borre tokens.
- **Regenerar** pone un token nuevo en la reserva; como solo existe el token actual, el anterior deja de funcionar al instante.
- **Todo enlace que no vale da 404** sin distinguir el motivo (inventado, regenerado, reserva cancelada).
- El token se guarda tal cual, sin hash: la BD ya guarda en claro el código de acceso y la clave del wifi que ese token protege.

## Consecuencias

**Positivas**
- Cero fricción para el huésped: abre el enlace desde el chat de Airbnb y ya está.
- No hace falta ningún dato del huésped que Airbnb no da.
- Personalizada (su nombre, sus fechas) y con fin automático al salir.

**Negativas**
- Quien tenga el enlace ve la estancia: si el huésped lo reenvía, el destinatario ve el código de acceso y el wifi hasta la salida. Se acepta: es la misma información que ya iba en el mensaje de instrucciones. Si el host sospecha de un enlace, lo regenera.
- El token viaja en la URL: la página no se indexa y no manda el `Referer` al salir a otras webs, para que no quede en registros ajenos.

**Riesgos y ceiling**
- `ponytail: un token por reserva sin sesión — si hiciera falta saber quién abrió el enlace o limitar dispositivos, añadir un registro de accesos o un código corto de confirmación detrás del mismo enlace.`
