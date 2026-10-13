# Matriz de estado funcional

| Grupo | Operaciones | Autenticación/roles observados | Evidencia | Estado | Responsable propuesto |
|---|---|---|---|---|---|
| Health | GET health | pública | `app.http.test.ts` | Verificado mediante prueba automatizada | Diego |
| Auth | register/login/me | JWT para me; rate limit login/register | `postgres.auth.test.ts`, HTTP baseline | Verificado mediante prueba automatizada | Diego |
| Sucursales | GET/POST/PATCH/DELETE | lectura pública; ADMIN escritura | `postgres.sucursales.test.ts`, OpenAPI | Verificado mediante prueba automatizada | Diego |
| Configuración IVA | GET/PATCH | bearer; ADMIN PATCH | `app.http.test.ts`, OpenAPI | Verificado mediante prueba automatizada | Diego |
| Reservas habitación | 5 operaciones | auth/roles según router; PostgreSQL | `postgres.reservations.test.ts` | Verificado parcialmente mediante prueba automatizada | José/Diego conjunto |
| Pagos y Stripe | 6 pagos + webhook | auth/roles; webhook firma raw | `postgres.payments.test.ts`, `app.http.test.ts`, unit Stripe | Verificado parcialmente mediante prueba automatizada | José |
| Carritos | 8 operaciones anidadas | inspección de router y service | sin suite HTTP específica completa | Evidencia parcial | José |
| Reservas de eventos/mesas/parqueo/amenidad/actividad/spa/transporte | 30 operaciones | inspección de routers y validadores; cobertura desigual | pruebas generales no exhaustivas | Evidencia parcial | José |
| Catálogos y administración | CRUD de salones, servicios, habitaciones, proveedores, personal, etc. | inspección de routers/roles/validators | sin prueba HTTP individual por recurso | Evidencia parcial | José |
| Facturación | factura y items | inspección de rutas/services | sin prueba HTTP específica completa | Pendiente de prueba | José |

La existencia de controller o documentación OpenAPI no se considera prueba de funcionamiento. No se reprodujeron defectos funcionales durante esta auditoría; las brechas son de evidencia, no afirmaciones de fallo.
