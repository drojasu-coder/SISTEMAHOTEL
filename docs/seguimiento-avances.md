# Seguimiento de Avances

Este documento registra de forma continua el avance técnico, archivos modificados, comandos ejecutados y bloqueos de cada tarea del encargo autónomo.

---

## Tarea 1: Completar lo posible de BE-014 (Pagos y Checkout)

- **Estado:** Completada la verificación de configuración y cobertura automatizada; comprobación interactiva en navegador detenida por bloqueo documentado.
- **Detalle de implementación / verificación:**
  - Verificada la configuración local sin revelar secretos: backend cuenta con `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` de prueba; frontend carece de `VITE_STRIPE_PUBLISHABLE_KEY`.
  - Cobertura automatizada revisada: verificados todos los casos de resiliencia transaccional (rechazo de tarjeta, recuperación de intento, protección contra cobro incompatible ante éxito pendiente de webhook, aislamiento por usuario, desajuste de importe, fin de sondeo).
  - Estado de BE-014 mantenido en: *integración/verificación pendiente* hasta que se cuente con la clave pública de frontend y entorno interactivo.
- **Archivos relevantes:**
  - `docs/seguimiento-integracion-pagos.md`
  - `backend/tests/pagos/pago.intentoActivo.test.ts`
  - `Frontend/src/features/pagos/CheckoutPage.test.tsx`
  - `Frontend/src/features/pagos/PagoResultadoPage.test.tsx`
- **Bloqueos registrados:**
  - Falta `VITE_STRIPE_PUBLISHABLE_KEY` en `Frontend/.env` y navegador interactivo para ejecutar la verificación manual de Stripe Elements / 3DS.
- **Servicios activos:**
  - Contenedor Docker `hotel_postgres_test` en puerto `55432`.

---

## Tarea 2: Completar contratos pendientes existentes (BE-010 y BE-006)

- **Estado:** Completada y verificada.
- **Detalle de implementación / corrección:**
  - **BE-010 (Parqueos):** Se añadió el tag `Parqueos` y los esquemas canónicos `Parqueo`, `CreateParqueoRequest`, `UpdateParqueoRequest`, `ParqueoResponse`, `ParqueosResponse` y `ParqueoDeleteResponse` en `backend/src/docs/swagger.ts`. Se vincularon las referencias formales `$ref` en `backend/src/routes/habitaciones/parqueo.routes.ts` para respuestas 200, 201 y errores estandarizados (400, 401, 403, 404, 409).
  - **BE-006 (Sedes):** Se completaron los esquemas `Sucursal`, `CreateSucursalRequest`, `UpdateSucursalRequest`, `SucursalResponse` y `SucursalesResponse` con `required` explícito y soporte de nulabilidad fiel para campos opcionales (`direccion`, `ciudad`, `telefono`). Se corrigió en `backend/src/routes/sucursales/sucursal.routes.ts` el esquema envoltorio `{ status: "success", data }` con referencias formales `$ref`.
  - **Pruebas de contrato:** Se incorporaron 2 pruebas exhaustivas en `backend/tests/unit/openapi.test.ts` validando la presencia de esquemas, campos obligatorios, nulabilidad y enlaces `$ref` en los endpoints.
  - **Tipos generados:** Se ejecutó `npm --prefix Frontend run api:generate` regenerando `Frontend/src/api/generated/schema.ts` (95 paths procesados).
  - **Documentación de pendientes:** Se actualizaron `BE-006` y `BE-010` como resueltos con evidencia en `docs/pendientes-backend.md`.
- **Archivos relevantes:**
  - `backend/src/docs/swagger.ts`
  - `backend/src/routes/habitaciones/parqueo.routes.ts`
  - `backend/src/routes/sucursales/sucursal.routes.ts`
  - `backend/tests/unit/openapi.test.ts`
  - `Frontend/src/api/generated/schema.ts`
  - `docs/pendientes-backend.md`
- **Comandos ejecutados y resultados:**
  - `npm --prefix backend test tests/unit/openapi.test.ts`: 9/9 pruebas aprobadas.
  - `npm --prefix backend run test:unit`: 73/73 pruebas unitarias aprobadas.
  - `npm --prefix Frontend run api:generate`: Tipos generados correctamente.
  - `npm --prefix Frontend run typecheck`: TypeScript compiló sin errores.
  - `npm --prefix Frontend test`: 261 pruebas aprobadas en 26 archivos (1 archivo omitido por integración de red real).
- **Bloqueos:** Ninguno.
