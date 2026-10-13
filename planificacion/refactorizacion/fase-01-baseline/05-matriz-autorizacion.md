# 05 — Matriz de autenticación, roles y ownership

## Roles definidos en código

`admin`, `recepcionista`, `gerente_restaurante`, `gerente_habitaciones`, `empleado_operativo` y `cliente`.

## Casos ejecutados

| Caso | Resultado |
|---|---|
| `/api/auth/me` sin token | 401 `AUTH_TOKEN_REQUIRED` |
| Ownership de carrito ajeno por cliente | Lanza `PAYMENT_ACCESS_DENIED` |
| Rol `admin` como administrador de pagos | `true` |
| Rol `cliente` como administrador de pagos | `false` |

Resultado: **4 casos, 4 exitosos**.

## Casos bloqueados

Token inválido/expirado, usuario inactivo, roles insuficientes en rutas protegidas, acceso a reservas/pagos ajenos con registros reales y combinación de roles administrativos por endpoint. Requieren fixture de usuarios y PostgreSQL aislado.

## Observación documental

La autorización efectiva se aplica por ruta o `router.use`; OpenAPI declara `bearerAuth` en muchas operaciones. La equivalencia completa entre documentación y middleware queda pendiente de pruebas por endpoint.
