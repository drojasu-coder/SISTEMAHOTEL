# 07 — Preparación para frontend

## Estado actual

El frontend podrá consumir el prefijo `/api` y las rutas listadas en `03-inventario-endpoints.md`, pero el contrato no está completamente estable: existen dos envelopes de éxito, documentación Swagger distribuida entre `app.ts`, `swagger.ts` y routers, y no hay pruebas de contrato automatizadas.

## Contrato que debe fijarse antes de integración

- URL base por ambiente, CORS y health check.
- Envelope de éxito y error, incluyendo `statusCode`, `code`, `message`, `details` y `data`.
- Campos, tipos y estados de cada recurso.
- Convención de fechas/horas y zona horaria.
- Semántica de `DELETE` de reservas (el código actual conserva historial).
- JWT: `Authorization: Bearer`, expiración y comportamiento ante usuario inactivo.
- Roles y endpoints permitidos para cliente, administración, recepción/gestión y proveedores.
- Payload raw y header `Stripe-Signature` para el webhook; el frontend no debe llamar ese endpoint.

## Recomendaciones de integración

1. Generar clientes/types desde una especificación OpenAPI revisada, no desde nombres inferidos.
2. Implementar un único interceptor para `401`, `403`, expiración y formato de error.
3. No asumir que todo `GET` es público: consultar la matriz de middleware.
4. Tratar estados como enums versionados; no construir lógica con mensajes humanos.
5. Separar pagos de reservas: mostrar estados `pendiente`, `aprobado`, `reembolsado_*` según contrato real.
6. Probar formularios con errores de Zod y conflictos 409/422, no solo caminos 200/201.
7. Mantener una prueba de humo para `/api/health`, login, catálogo, reserva, carrito y pago de prueba.

## Gaps a resolver antes de cerrar integración

- Decidir si se mantiene compatibilidad de ambos envelopes o se introduce `/api/v2`.
- Completar schemas de respuesta en OpenAPI; los comentarios actuales describen varias rutas, pero no sustituyen pruebas.
- Definir paginación/filtros si el frontend necesita listados grandes; actualmente no existe una política transversal.
- Acordar formato de errores de campo para formularios.
- Documentar datos de desarrollo y credenciales solo por variables de entorno.
- Entregar colección de requests reproducible contra una base de prueba, sin datos productivos.

## Criterios de listo para frontend

- Todos los endpoints consumidos tienen método/ruta/body/response documentados y probados.
- 401/403/404/409/422 tienen comportamiento estable.
- Login, refresh/expiración si se implementa, logout del cliente y usuario inactivo están acordados.
- Reserva concurrente y pago/reembolso están probados en una base PostgreSQL.
- No hay cambios de contrato pendientes mezclados con refactor interno.

Esta auditoría se detiene aquí. La refactorización no debe comenzar hasta recibir autorización explícita y seleccionar una primera fase.
