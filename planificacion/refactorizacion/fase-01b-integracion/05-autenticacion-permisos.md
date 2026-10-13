# Fase 1B — Autenticación y permisos

`postgres.auth.test.ts` usa HTTP contra la aplicación y persistencia PostgreSQL
aislada. Cubre registro/login, credenciales inválidas, token válido, rol insuficiente
y usuario inactivo.

Resultado: **3/3 pruebas exitosas**.

La línea base HTTP existente mantiene además la comprobación de recursos protegidos y
del webhook raw. Queda pendiente ampliar explícitamente token expirado, token
malformado y todos los casos de ownership entre módulos.
