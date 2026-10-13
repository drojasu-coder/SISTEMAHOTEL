# Logger centralizado

`src/utils/logger.ts` ofrece `debug`, `info`, `warn` y `error`, timestamp UTC ISO-8601, servicio y ambiente. `LOG_FORMAT=json` genera entradas JSON; `pretty` genera líneas legibles. `LOG_LEVEL` filtra severidad.

Los objetos `Error` se serializan con nombre, mensaje y stack saneados. No se escriben archivos locales.

