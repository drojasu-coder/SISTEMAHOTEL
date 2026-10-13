# Compatibilidad y dependencias

Se preservaron URLs, métodos, respuestas, mensajes, status, validación Zod, autenticación y rol ADMIN. `getCurrentIva`, `updateIva` y `getIvaValue` conservan la creación implícita con IVA 12 y el error `IVA_CONFIGURATION_INVALID`.

El módulo mantiene la importación del modelo Sequelize desde su ubicación existente. No se agregaron repositorios ni DTOs porque no aportaban aislamiento real. No se observaron importaciones circulares nuevas; los imports legacy son fachadas unidireccionales hacia el módulo.
