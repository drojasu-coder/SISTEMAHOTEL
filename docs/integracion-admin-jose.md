# Integración administrativa de José

Fecha: 2026-10-27. **Código integrado selectivamente; verificación autenticada y persistencia real pendientes.** Las pantallas principales ya sustituyen a los placeholders. Pagos/reembolsos conserva alcance de consulta: las acciones financieras no están habilitadas.

Este informe actualiza el reconocimiento anterior. El bloqueo original se debió al nombre incorrecto `entrega/panales-admin-27`; se resolvió con la referencia confirmada `entrega/paneles-admin-27oct`. No se reinició una auditoría general.

## A. Origen y comparación

- Remoto: `origin`, `https://github.com/drojasu-coder/SISTEMAHOTEL.git`.
- Origen verificado mediante `git ls-remote --heads origin entrega/paneles-admin-27oct` y fetch exacto: `origin/entrega/paneles-admin-27oct`.
- Commit de José: `1d94a807e98ac99022a0612b97c0ffbd1f9c4776`, Jos0518, «feat(admin): implementar paneles de facturacion pagos y personal».
- Rama de trabajo y HEAD conservados: `refactor/backend-architecture`, `eb7b16a730f81edf1b16d3d3aca07af86ced556c`.
- Ancestro común: ese mismo HEAD; diferencia `HEAD...origen`: **0 commits exclusivos actuales / 1 entrante**.
- Entrega: 35 archivos, sin eliminaciones; no cambia `package.json` ni lockfiles y no requiere dependencias nuevas. Incluye una migración aditiva de pasaporte, no aplicada ni activada.
- Tres páginas, no cuatro independientes: José agrupó Usuarios dentro de Personal. Su documentación reconoce que las operaciones financieras requieren QA pendiente y que no pudo ejecutar build/tests completos en su entorno.

### Destino de cada archivo entrante

A = añadido por José; M = modificado por José. «Diferido» significa no incorporado; el contenido continúa disponible en su rama, no se eliminó del origen.

| Cambio | Archivo | Resolución |
| --- | --- | --- |
| M | `Frontend/src/app/router/AppRouter.tsx` | Integrado selectivamente; preservada la redirección local de reservas. |
| A | `Frontend/src/features/admin-core/ConfirmActionModal.test.tsx` | Incorporado y aprobado. |
| A | `Frontend/src/features/admin-core/adminVisualPolish.test.tsx` | Incorporado y aprobado. |
| A | `Frontend/src/features/admin-core/workbench.test.ts` | Incorporado y aprobado. |
| A | `Frontend/src/features/admin-core/workbench.tsx` | Incorporado y adaptado: HTTP/Query, errores, moneda, idioma y duplicados. |
| A | `Frontend/src/pages/FacturacionPage.tsx` | Incorporado y adaptado al contrato vigente, sin pasaporte ni consumos-pagados. |
| A | `Frontend/src/pages/PagosAdminPage.tsx` | Incorporada consulta; no se importaron mutaciones financieras condicionadas a QA. |
| A | `Frontend/src/pages/PersonalPage.tsx` | Incorporado: personal y usuarios; adaptado a reglas vigentes y confirmación de cambio de rol. |
| M | `Frontend/src/vite-env.d.ts` | No incorporado: no se habilita un flag que active operaciones financieras no certificadas. |
| M | `Frontend/tsconfig.json` | No incorporado: cambio de aliases innecesario; configuración actual compila. |
| A | `backend/src/controllers/habitaciones/consumosPagados.controller.ts` | Diferido con la lectura financiera nueva: requiere validar cobertura y trazabilidad en aislamiento; no se presenta en la UI. |
| A | `backend/src/migrations/20261027001000-add-pasaporte-to-facturas.js` | Diferido junto al pasaporte/migración y validación nueva de NIT; se conserva el esquema vigente. |
| M | `backend/src/models/factura.js` | Diferido junto al pasaporte/migración y validación nueva de NIT; se conserva el esquema vigente. |
| M | `backend/src/routes/habitaciones/factura.routes.ts` | Integrado solo el control de roles de lectura; no el endpoint nuevo de consumos. |
| M | `backend/src/routes/habitaciones/facturaItem.routes.ts` | Integrada la restricción de roles de lectura. |
| A | `backend/src/services/habitaciones/consumosPagados.logic.ts` | Diferido con la lectura financiera nueva: requiere validar cobertura y trazabilidad en aislamiento; no se presenta en la UI. |
| A | `backend/src/services/habitaciones/consumosPagados.service.ts` | Diferido con la lectura financiera nueva: requiere validar cobertura y trazabilidad en aislamiento; no se presenta en la UI. |
| M | `backend/src/services/habitaciones/factura.service.ts` | Diferido junto al pasaporte/migración y validación nueva de NIT; se conserva el esquema vigente. |
| M | `backend/src/services/personal/turno.service.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| M | `backend/src/services/transporte/chofer.service.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| M | `backend/src/services/transporte/vehiculo.service.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| A | `backend/src/utils/reglasPersonal.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| M | `backend/src/validators/habitaciones/factura.validator.ts` | Diferido junto al pasaporte/migración y validación nueva de NIT; se conserva el esquema vigente. |
| M | `backend/src/validators/personal/empleado.validator.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| M | `backend/src/validators/transporte/chofer.validator.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| M | `backend/src/validators/transporte/vehiculo.validator.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| A | `backend/tests/auth/facturaOtherRolesAccess.test.ts` | Incorporado sin debilitarlo; ejecución PostgreSQL pendiente en 55433. |
| M | `backend/tests/auth/facturaOwnership.test.ts` | Conservada la prueba actual; el cambio entrante exige un modelo pasaporte que no se activó. |
| A | `backend/tests/unit/consumosPagados.logic.test.ts` | Diferido con la lectura financiera nueva: requiere validar cobertura y trazabilidad en aislamiento; no se presenta en la UI. |
| A | `backend/tests/unit/facturaNitChoferLicencia.validator.test.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| A | `backend/tests/unit/facturaPassport.validator.test.ts` | Diferido junto al pasaporte/migración y validación nueva de NIT; se conserva el esquema vigente. |
| A | `backend/tests/unit/reglasPersonal27Oct.test.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| A | `backend/tests/unit/vehiculoPlacaObligatoria.validator.test.ts` | Diferido: reglas nuevas de turnos, área, licencia o placa y pruebas asociadas; no son necesarias para conectar los endpoints vigentes. |
| A | `qa/release/CONSUMOS_REALES_CARRITOS_PAGADOS_27OCT.md` | Consultado como evidencia de José; no copiado como certificación de esta ejecución. |
| A | `qa/release/PANELES_ADMIN_27OCT.md` | Consultado como evidencia de José; no copiado como certificación de esta ejecución. |

### Conflictos y reconciliación

El router tenía modificaciones locales de Habitaciones. Se añadieron únicamente imports y selección de las tres páginas administrativas. Al retirar esas adiciones en memoria, el hash coincide con el router local inicial: su redirección `/crear-reserva` y demás cambios se conservaron exactamente.

`AdminLayout` y `AdminPage` estaban limpios al comenzar; se adaptaron para idioma y acceso claro a Personal y usuarios. No se reemplazaron por versiones antiguas. Se reutiliza el Modal existente, que tenía cambios ajenos, sin modificarlo. No hubo conflictos sin resolver en los archivos incorporados.

No se realizó checkout, merge, rebase, stash, reset, clean, commit o push. No se crearon worktrees ni clones.

## B. Estado funcional de los módulos

| Módulo | Entrega real | Integración actual y correcciones | Comprobación y pendiente |
| --- | --- | --- | --- |
| Facturación | Listado, búsqueda/estado, indicadores, detalle, alta/edición fiscal, conceptos y eliminaciones; añadió pasaporte y vista informativa de carritos | Conectado a `/facturas` y `/factura-items`. Conserva documentos internos, subtotal inicial 0 y cálculo del servidor. Se retiraron campos y llamadas de ampliaciones no activadas. Se reutiliza MoneyReference y ES/EN | Rutas, lectura de conceptos y payload de alta cubiertos con mocks. Operaciones persistentes con sesión real pendientes. Pasaporte y consumos de carritos diferidos |
| Pagos/reembolsos | Listado, filtros, paginación, detalle; aprobación/reembolso detrás de flag apagado por defecto | Consulta conectada a `/pagos`, estados reales, moneda de cada registro, indicadores separados por moneda y errores sin detalles técnicos. Sin flag que habilite escrituras financieras | Consulta, detalles y moneda cubiertos con mocks. Historial individual de reembolsos y operaciones financieras no habilitados; no se afirma conciliación ni pago realizado |
| Personal | Pestañas empleados, turnos, choferes, vehículos y usuarios; formularios y acciones | Usa endpoints actuales, distingue empleado de cuenta, filtra candidatos activos/no clientes/sin ficha y sedes activas. Mantiene conflictos del servidor y confirmaciones. No impone las restricciones nuevas de José sobre pasado/licencias/placas/áreas | Selecciones, capacidad, conflicto de turno y estados cubiertos con mocks. Persistencia real y recorridos completos de cada operación pendientes |
| Usuarios | Pestaña en Personal, listado, alta, edición y estado; no página independiente | Acceso admin dentro de `/admin/personal`; añadida edición de rol mediante endpoint específico y confirmación. Cuenta propia protegida según servidor; contraseña temporal se limpia al cerrar/guardar | Alta, duplicados, limpieza de contraseña, cambio de estado y rol cubiertos con mocks. Mutaciones reales no ejecutadas |

No hay un segundo sistema de autenticación, carrito o pagos. No se muestran secretos, hashes ni tokens de usuarios. No se ofrece emisión fiscal certificada, exportación o documentos inexistentes.

## C. Rutas, permisos y contratos

| Interfaz | Contratos utilizados | Acceso |
| --- | --- | --- |
| `/admin/facturacion` | GET/POST `/facturas`, PATCH `/facturas/:id`, GET/POST `/factura-items`, DELETE `/factura-items/:id` | Admin, recepcionista, gerente_habitaciones. Consulta de usuarios para selector solo admin; otros roles conservan entrada de ID respaldada por contrato |
| `/admin/pagos` | GET `/pagos`; filtro y paginación de la lista recibida | Admin, recepcionista, gerente_habitaciones |
| `/admin/personal` | GET/POST/PATCH/DELETE de empleados, turnos y vehículos; GET/POST/PATCH/estado de choferes; GET de sucursales | Admin |
| Usuarios dentro de Personal | GET/POST `/usuarios`, PATCH `/usuarios/:id`, `/usuarios/:id/estado`, `/usuarios/:id/rol` | Admin |

Se conservaron `PANEL_MODULES`, `RequireAuth`, el middleware backend y la propiedad de las consultas cliente. El menú no añade una ruta inexistente para Usuarios; identifica el acceso agrupado como «Personal y usuarios».

**Compatibilidad de respuesta corregida (QA-ADMIN-CONTRACT-001):** el GET real de sucursales devuelve `{ status: "success", data: [...] }`, mientras los demás controladores administrativos usan `{ success: true, data: [...] }`. Una comprobación agregada durante esta integración exigía exclusivamente `success` y rechazaba sedes válidas. La regresión falló antes de corregir el lector; ahora admite ambos contratos observados y rechaza envolturas fallidas o datos que no sean listas. El mock de integración de sedes reproduce la variante real.

**QA-ADMIN-FACT-AUTH-001:** las lecturas fiscales solo exigían autenticación; los servicios limitaban por propietario únicamente al cliente. Se reprodujo que dos roles operativos alcanzaban controladores fiscales (200 en lugar de 403). Se integró el `requireRole` de José en los cuatro GET, conservando acceso de los tres roles administrativos y del cliente, cuyo filtro de propiedad sigue en los servicios. Registrado mediante adición al registro QA existente.

Reutilizados: `AdminLayout`, `Card`, `Button`, `Input`, `Modal`, `Badge`, `Alert`, `LoadingNotice`, `Drawer`, `MoneyReference`, cliente `api`, normalización de errores, TanStack Query, `LocaleProvider` y `LanguageSelector`. No se cambiaron componentes globales de medios ni estilos globales. Los importes GTQ usan el componente monetario común; otras monedas mantienen el importe y código registrados. No se suman monedas diferentes en un mismo importe.

Las escrituras no se reintentan automáticamente; la mutación compartida bloquea solicitudes simultáneas y los formularios/confirmaciones muestran envío en curso. Los éxitos solo se anuncian tras una respuesta satisfactoria. Los errores controlados del servidor pueden conservar su texto español; errores de red/5xx usan mensajes comunes seguros. Se distingue lista vacía, filtros sin resultados y error.

No se cambió el esquema PostgreSQL, el origen de importes, Stripe, webhooks, liquidación, AWS, DNS o infraestructura. Los impuestos y totales de factura siguen en `facturaItem.service.ts`/`factura.service.ts`.

## D. Archivos de esta integración

Lista exacta de código/documentación deliberadamente incorporados o editados en esta tarea (18 archivos; el informe ya existía):

- `Frontend/src/app/router/AppRouter.tsx`
- `Frontend/src/layouts/AdminLayout.tsx`
- `Frontend/src/pages/AdminPage.tsx`
- `Frontend/src/pages/FacturacionPage.tsx`
- `Frontend/src/pages/PagosAdminPage.tsx`
- `Frontend/src/pages/PersonalPage.tsx`
- `Frontend/src/features/admin-core/workbench.tsx`
- `Frontend/src/features/admin-core/i18n.ts`
- `Frontend/src/features/admin-core/workbench.test.ts`
- `Frontend/src/features/admin-core/adminVisualPolish.test.tsx`
- `Frontend/src/features/admin-core/ConfirmActionModal.test.tsx`
- `Frontend/src/features/admin-core/adminIntegration.test.tsx`
- `backend/src/routes/habitaciones/factura.routes.ts`
- `backend/src/routes/habitaciones/facturaItem.routes.ts`
- `backend/tests/auth/facturaOtherRolesAccess.test.ts`
- `backend/tests/unit/adminFiscalRoles.test.ts`
- `qa/registry.yml`
- `docs/integracion-admin-jose.md`

Los grafos generados se actualizaron por la herramienta, sin modificar manualmente sus reportes. La migración y el resto de archivos diferidos no se copiaron al árbol.

## E. Verificación

### Resultados finales

| Comprobación | Resultado |
| --- | --- |
| Frontend: módulos administrativos, permisos, RequireAuth, layout, router y cliente de pagos | **76 pruebas aprobadas, 9 archivos, 0 fallos** |
| Backend: prueba unitaria de routers y roles, sin modelos/DB | RED: 2 fallos y 5 correctas; GREEN: **7 aprobadas** |
| Typecheck frontend | Correcto; también ejecutado dentro del build final |
| Typecheck backend | Correcto |
| Build frontend | Correcto; advertencia de bundle mayor de 500 kB, sin ocultarla ni cambiar el umbral |
| Diff de espacios | `git diff --check` correcto |
| GET reales sin credenciales | Ocho endpoints protegidos devuelven 401; sucursales devuelve 200 |
| Navegador con sesión autorizada | No comprobado: la herramienta no tiene navegadores/sesiones disponibles |
| PostgreSQL autenticado/persistencia | No comprobado; no se ejecutaron mutaciones contra desarrollo |

Comando frontend final:

```bash
npm --prefix Frontend test -- src/features/admin-core src/features/auth/permissions.test.ts src/features/auth/components/RequireAuth.test.tsx src/app/ResponsiveLayouts.test.tsx src/app/router/ReservasRouter.test.tsx src/features/pagos/api/pagosApi.test.ts --maxWorkers=2 --minWorkers=1
npm --prefix Frontend run typecheck
npm --prefix Frontend run build
npm --prefix backend run typecheck
npm --prefix backend test -- --project baseline tests/unit/adminFiscalRoles.test.ts
```

Las pruebas de integración frontend usan HTTP simulado: navegación real de AppRouter entre módulos, denegación por rol sin consultar facturas, contrato de alta de factura, conceptos, opciones válidas de personal, capacidad, conflicto de turno, alta/estado/rol de usuario, confirmación explícita, duplicados, limpieza de contraseña, detalle de pago en moneda original, error de red/reintento GET y cambio ES/EN. Las pruebas existentes del layout verifican menú móvil, teclado y foco. Esto **no certifica persistencia PostgreSQL ni una revisión visual en navegador**.

La prueba backend simula autenticación/controladores y usa el middleware de roles real; no carga modelos ni utiliza PostgreSQL. La prueba original de José `facturaOtherRolesAccess.test.ts` se incorporó, pero **no se ejecutó**: el único contenedor de pruebas visible estaba en 55432, que el usuario prohíbe para experimentos destructivos. No había aislamiento 55433 disponible. No se ejecutó la suite backend con borrados ni se modificó su guard.

GET reales de solo lectura a `http://localhost:4000/api`: `facturas`, `factura-items`, `pagos`, `empleados`, `turnos`, `usuarios`, `choferes`, `vehiculos` → **401 AUTH_TOKEN_REQUIRED**; `sucursales` → **200**, envoltura `status: success` y cuatro registros reales. Esto acredita la barrera anónima y el servicio público de sedes; no acredita lectura administrativa autorizada.

El fallo previo de `RoomPages.test.tsx` por `fireEvent` ya no aparece: el typecheck de base pasó antes de incorporar José. No se modificó ese archivo. Las pruebas previas siguen emitiendo avisos de mocks de branding y de futuras opciones de React Router; no son fallos ni se silenciaron. No se ocultaron, saltaron ni debilitaron pruebas fallidas.

Evidencia temporal: `/tmp/hunahpu-admin-final-{regression,focused,typecheck,build}.log`, `/tmp/hunahpu-admin-backend-typecheck.log`, `/tmp/hunahpu-admin-fiscal-{red,green}.log` y `/tmp/hunahpu-admin-envelope-red.log`.

## F. Pendientes y límites

1. **Validación operativa pendiente:** probar GET administrativos con sesión autorizada existente y verificar formularios/persistencia solo en el aislamiento permitido 55433. No se inventaron credenciales ni se crearon datos en hotel_db. Sin esto no se declara una integración funcional real completamente certificada.
2. **Pagos/reembolsos parcial:** la entrega de José exige resolver/certificar su pendiente financiero antes de activar aprobaciones y devoluciones. Esta integración conserva solo consulta; no basta configurar un flag para certificar idempotencia o conciliación. No se realizaron cargos ni reembolsos. No se añadió un endpoint de historial inexistente en el contrato inspeccionado.
3. **Pasaporte diferido:** requiere revisar/aplicar de forma controlada la migración `20261027001000-add-pasaporte-to-facturas.js`, validar esquema y completar regresiones. Activar el modelo antes de migrar haría fallar consultas de facturas; por eso ni campo ni modelo se habilitaron. El NIT conserva el contrato vigente, sin imponer automáticamente la validación nueva de José.
4. **Consumos de carritos diferidos:** José añadió un endpoint que reconstruye cobertura de carritos del titular, no una relación persistente entre cada consumo y esta factura. Usa un límite de 100 carritos y cálculos derivados. Debe revisarse y probarse financieramente antes de presentarlo como trazabilidad de una factura. La UI no realiza esa llamada ni simula su resultado.
5. **Reglas adicionales diferidas:** prohibir turnos históricos, áreas con números, licencias no numéricas y placas ausentes modifica contratos actuales, incluidos registros históricos y transporte. Se documenta separadamente de la conexión de paneles; la UI se ajustó al servidor vigente.
6. **Mejoras recomendadas:** paginación del servidor para listas grandes; partición del bundle; revisión visual móvil/escritorio con sesión; completar los recorridos CRUD no cubiertos por mocks. No se añadieron dependencias para resolverlos.

## G. Git, preservación y Graphify

Se inventariaron diferencias preexistentes en `/tmp/hunahpu-admin-resume-baseline.json` (hashes/estado, sin copiar fuentes). Al cierre, 91 archivos preexistentes independientes conservan exactamente sus hashes. Los dos archivos compartidos que requerían reconciliación fueron el router y el registro QA: el router conserva íntegramente su versión local previa más las tres rutas de panel; al registro QA se añadió únicamente el hallazgo propio, sin sustituir sus entradas ni cambios concurrentes. El informe fue actualizado según lo solicitado.

El árbol continúa con cambios ajenos y propios sin confirmar. HEAD y rama permanecen iguales; no hay commit ni push. `docs/informe-avances.md` no se tocó. Tampoco se editaron fuentes públicas de habitaciones, reservas, spa, actividades o eventos.

Graphify se consultó antes de explorar y se contrastó con el código. Se ejecutó `graphify update .` desde Frontend y desde la raíz:

- Frontend: **2.034 nodos. 9.799 aristas, 81 comunidades**.
- Raíz: **4.632 nodos. 15.588 aristas, 246 comunidades**; la actualización configurada indexó código del repositorio, incluido frontend.
- Las tres páginas y la prueba backend aparecen en sus grafos correspondientes.
- Extracción AST local: **0 tokens de entrada, 0 de salida, sin coste API**. La herramienta conservó respaldos automáticos de artefactos anteriores; no se editaron reportes manualmente.
- Advertencias conservadas: algunos archivos no producen símbolos, una entrada SQL no se extrae por faltar `tree_sitter_sql` y los nombres semánticos de comunidades podrían refrescarse con LLM. No se instaló nada ni se hizo esa llamada externa.

La entrega queda incorporada en el alcance compatible descrito. Las ampliaciones diferidas y la certificación autenticada permanecen explícitamente pendientes.

---

## H. Certificación funcional real — 2026-10-27

### 1. Entorno utilizado y conexiones verificadas

- Rama/HEAD conservados: `refactor/backend-architecture`, `eb7b16a730f81edf1b16d3d3aca07af86ced556c`.
- Backend de verificación: `NODE_ENV=test`, puerto `4010`, base `hotel_test_db` (PostgreSQL Docker `hotel_postgres_test`, host `127.0.0.1:55432`).
- Guardia QA: salida `[QA DB GUARD] Base de datos detectada: hotel_test_db` y `[QA DB GUARD] ✅ Entorno de pruebas seguro` al ejecutar `tests/auth/facturaOtherRolesAccess.test.ts` con `--project qa`.
- Base de desarrollo `hotel_db` (puerto `5432`) no fue modificada; no se ejecutaron migraciones destructivas.
- No se usó `55433`; el único aislamiento disponible fue `55432/hotel_test_db`.
- Frontend typecheck/build ejecutados sobre el árbol existente; servidor frontend de desarrollo observado en `5173`, pero no se realizó recorrido visual autenticado.
- Credenciales de verificación creadas únicamente en `hotel_test_db` (`qa.verify.admin@hotel.test`, `qa.verify.recepcionista@hotel.test`, `qa.verify.gerenteh@hotel.test`, `qa.verify.cliente@hotel.test`). No se exponen contraseñas ni tokens en este informe.

### 2. Estado de los cuatro módulos

| Módulo | Estado |
| --- | --- |
| Facturación | **APROBADO** para lectura/escritura real en `hotel_test_db`, incluyendo conceptos, totales, filtros, detalle, edición y eliminación. |
| Personal | **APROBADO** para empleados, turnos, choferes y vehículos, incluyendo validaciones, conflictos y restricciones por sede. |
| Usuarios | **APROBADO** para listado, alta, edición, estado, rol, protección de cuenta propia y escalamiento de privilegios. |
| Pagos | **APROBADO** exclusivamente para consulta, filtros, detalle y moneda original. Aprobaciones y reembolsos permanecen bloqueados. |

### 3. Operaciones verificadas realmente

**Facturación**
- `GET /facturas`, `GET /facturas/:id`, `POST /facturas`, `PATCH /facturas/:id`, `DELETE /facturas/:id`.
- `GET /factura-items`, `POST /factura-items`, `PATCH /factura-items/:id`, `DELETE /factura-items/:id`.
- Creación con `subtotal: 0` y recálculo de subtotal/IVA/total tras crear/eliminar conceptos.
- Filtros por estado y búsqueda por ID/NIT/nombre/usuario.
- Restricción de eliminación de factura con conceptos asociados (`409 FACTURA_CON_ITEMS`).
- Propiedad del cliente: solo ve sus facturas; `404` al intentar leer factura ajena.

**Personal**
- Empleados: alta, duplicado (`409`), usuario cliente rechazado, sede inactiva rechazada, edición, eliminación bloqueada con turnos (`409`), eliminación exitosa.
- Turnos: alta, traslape (`409`), rango inválido (`422`), edición, eliminación.
- Choferes: alta, edición, cambio de estado.
- Vehículos: alta, edición, eliminación si no tiene reservas.

**Usuarios**
- Alta, edición, duplicado de correo (`409`), cambio de rol, activación/desactivación.
- Protección de cuenta propia: cambio de rol propio (`422 CANNOT_CHANGE_OWN_ROLE`) y desactivación propia (`422 CANNOT_DISABLE_OWN_ACCOUNT`).
- Rol no administrador no puede cambiar roles (`403`).

**Pagos**
- Listado vacío y con filtros válidos/inválidos (`400` para estado inválido).
- Detalle inexistente (`404 PAYMENT_NOT_FOUND`).
- Validación de parámetros en `resumen` e `intento-activo` (`400`).
- Cliente solo ve sus pagos mediante filtro de propiedad.
- No se ejecutaron aprobaciones, reembolsos, cargos ni operaciones contra Stripe.

### 4. Pruebas realizadas y resultados

| Comprobación | Resultado |
| --- | --- |
| Frontend admin-core/auth/permisos/router/pagos (76 pruebas) | **APROBADO** |
| Backend `tests/unit/adminFiscalRoles.test.ts` (7 pruebas) | **APROBADO** |
| Backend `tests/auth/facturaOtherRolesAccess.test.ts` (1 prueba, proyecto `qa`) | **APROBADO** |
| Typecheck frontend | **APROBADO** |
| Build frontend | **APROBADO** (advertencia de bundle >500 kB, sin ocultarla) |
| Typecheck backend | **APROBADO** |
| HTTP real contra `hotel_test_db` (roles, validaciones, CRUD, IDOR) | **APROBADO** |
| Persistencia PostgreSQL real | **APROBADO** (verificado mediante respuestas y consultas SQL posteriores) |
| Navegador real / recorrido visual | **NO VERIFICADO** (no hubo navegador ni herramienta de automatización disponible en esta sesión) |

Comandos relevantes:

```bash
npm --prefix Frontend run typecheck
npm --prefix Frontend run build
npm --prefix Frontend test -- src/features/admin-core src/features/auth/permissions.test.ts src/features/auth/components/RequireAuth.test.tsx src/app/ResponsiveLayouts.test.tsx src/app/router/ReservasRouter.test.tsx src/features/pagos/api/pagosApi.test.ts --maxWorkers=2 --minWorkers=1
npm --prefix backend run typecheck
npm --prefix backend test -- tests/unit/adminFiscalRoles.test.ts
npm --prefix backend test -- --project qa tests/auth/facturaOtherRolesAccess.test.ts
```

### 5. Evidencia de persistencia

Se crearon, consultaron, modificaron y eliminaron registros reales en `hotel_test_db`:
- Factura creada con `subtotal: 0`, concepto creado con subtotal `201.00`, factura recalculada a subtotal `201.00`, IVA `24.12`, total `225.12`; tras eliminar el concepto volvió a `0.00`; factura eliminada y posterior `GET` devolvió `404 FACTURA_NOT_FOUND`.
- Empleado creado para usuario recepcionista y sucursal QA; turno creado; eliminación del empleado bloqueada mientras existía turno.
- Usuario temporal creado, editado, cambio de rol, desactivado/reactivado y luego dejado inactivo para no interferir.
- Chofer y vehículo creados, editados y (vehículo) eliminado.

### 6. Errores detectados

No se detectaron nuevos defectos en el alcance certificado. Se confirmaron los controles ya registrados:
- `QA-ADMIN-CONTRACT-001`: compatibilidad de envoltura `status: success` vs `success: true` en sedes, resuelta en frontend.
- `QA-ADMIN-FACT-AUTH-001`: lectura fiscal restringida a roles administrativos/operativos autorizados, resuelta en backend.

Observaciones no bloqueantes:
- `GET /pagos` no admite paginación en backend; la paginación de `PagosAdminPage` es del lado cliente. No es un defecto del contrato actual, pero conviene documentarlo como mejora futura.
- `POST /facturas` acepta `estado` en el validador, pero el servicio fuerza `pendiente`. No afecta la UI actual, que no envía `estado`.
- La advertencia de bundle mayor a 500 kB permanece; no se cambió el umbral.

### 7. Correcciones realizadas y archivos afectados

No se realizaron correcciones nuevas de código en esta certificación. Se reutilizó la integración existente y se verificó su comportamiento real. No se modificaron archivos de producción durante esta fase.

### 8. Funcionalidades no verificadas y motivos

- Recorrido visual en navegador con sesión autenticada: **NO VERIFICADO**. No hubo navegador ni Playwright/Cypress disponible en esta sesión.
- Aprobaciones de transferencias y reembolsos: **NO VERIFICADO** y deliberadamente no ejecutado por regla financiera.
- Pasaporte en facturas y consumos de carritos pagados: **NO VERIFICADO**, diferidos por decisión de integración.
- Reglas adicionales de personal (turnos históricos, áreas, licencias, placas): **NO VERIFICADO**, diferidas por decisión de integración.

### 9. Pendientes que requieren participación de José

1. Validación financiera de aprobaciones de transferencias y reembolsos antes de habilitarlos.
2. Revisión/aplicación controlada de la migración `20261027001000-add-pasaporte-to-facturas.js` y validación de NIT.
3. Revisión financiera del endpoint de consumos de carritos pagados antes de presentarlo como trazabilidad de factura.
4. Decisión sobre reglas adicionales de personal y transporte que modifican contratos vigentes.
5. Paginación del servidor para listas grandes y partición del bundle.

### 10. Riesgos restantes

- La certificación visual final depende de un recorrido con sesión real en navegador.
- Las ampliaciones diferidas no están activas; no deben presentarse como funcionales.
- `hotel_test_db` contiene registros de verificación identificables (`qa.verify.*`) que pueden limpiarse después de la aceptación.

### 11. Recomendación sobre cierre

La integración está **APROBADA** para el alcance efectivamente integrado: Facturación, Personal, Usuarios y Pagos en modo consulta. No está lista para declarar cierre total mientras existan ampliaciones diferidas (pasaporte, consumos, reglas adicionales) y la verificación visual autenticada pendiente. Se recomienda cerrar el alcance integrado y dejar las ampliaciones como trabajo separado bajo validación de José.


## Verificación del sistema de desarrollo y selector GTQ/USD — 2026-10-27

Esta sección registra comprobaciones posteriores sobre **hotel_db de desarrollo**.
Las pruebas anteriores contra hotel_test_db se conservan como evidencia histórica;
no se repitieron ni se ejecutó QA destructiva en desarrollo.
El recorrido autenticado en Chromium que antes estaba pendiente ya se realizó.

### Entorno y acceso legítimo

- Rama `refactor/backend-architecture`; HEAD `eb7b16a730f81edf1b16d3d3aca07af86ced556c`.
- Frontend real `http://localhost:5173`, API real `http://localhost:4000/api` y PostgreSQL `hotel_db` en `127.0.0.1:5432`.
- Se reutilizaron los servicios existentes, sin reiniciar servidores ni ejecutar migraciones.
- Por autorización explícita del propietario se creó una cuenta administrativa temporal distinta, ID **19**.
- El mecanismo independiente, externo al repositorio, aplicó `createUsuarioAdminSchema` y el servicio real de creación de usuarios (hash bcrypt normal). No se modificó `create-admin.ts`.
- Credenciales aleatorias protegidas fuera del repositorio: archivo modo `0600`, directorio modo `0700`. No se incluyen valores, tokens ni contraseñas en este informe.
- La comparación de los registros originales de usuarios antes/después coincidió; no se modificaron cuentas existentes.

### Selector monetario incorporado

Se repitieron las comprobaciones sobre el **árbol principal actual**, no sobre el worktree:
los 30 hashes base coincidieron y `git apply --check` aprobó. Se aplicó únicamente el parche
monetario y se comprobaron los 30 hashes de resultado. No hubo conflictos textuales.
El worktree independiente y sus entregables siguen conservados.

La moneda GTQ es el valor inicial. La preferencia independiente del idioma se conserva en
`hunahpu.currency.v1`; USD se deriva siempre del importe base GTQ dividiendo entre `7.80`.
`MoneyReference` comparte conversión y formato; documentos financieros, importes históricos
y la confirmación de Stripe conservan su moneda contractual. No se alteraron cálculos
financieros ni precios de PostgreSQL.

Archivos del parche incorporado:

- `Frontend/src/components/shared/PublicTopBar.tsx`
- `Frontend/src/components/ui/MoneyReference.tsx`
- `Frontend/src/features/actividades/CatalogoActividadesCliente.test.tsx`
- `Frontend/src/features/admin-core/workbench.tsx`
- `Frontend/src/features/bienestar/CatalogoBienestarCliente.test.tsx`
- `Frontend/src/features/carrito/CarritoPage.test.tsx`
- `Frontend/src/features/carrito/components/CarritoItemCard.tsx`
- `Frontend/src/features/compra/PurchaseReservations.tsx`
- `Frontend/src/features/compra/purchaseFlow.test.tsx`
- `Frontend/src/features/crear-reserva/CrearReservaPage.test.tsx`
- `Frontend/src/features/eventos/CatalogoSalonesCliente.test.tsx`
- `Frontend/src/features/eventos/components/AgregarServicioEventoModal.tsx`
- `Frontend/src/features/habitaciones/public/RoomPages.test.tsx`
- `Frontend/src/features/pagos/PagoResultadoPage.test.tsx`
- `Frontend/src/features/pagos/components/ListaArticulosCheckout.tsx`
- `Frontend/src/features/pagos/components/PagoResultadoCard.tsx`
- `Frontend/src/features/pagos/components/ResumenCheckout.tsx`
- `Frontend/src/features/pagos/components/StripePaymentForm.tsx`
- `Frontend/src/features/preferencias/CurrencyCatalogs.test.tsx`
- `Frontend/src/features/preferencias/CurrencyCheckout.test.tsx`
- `Frontend/src/features/preferencias/CurrencyPreference.test.tsx`
- `Frontend/src/features/preferencias/CurrencySelector.tsx`
- `Frontend/src/features/preferencias/consumers.test.tsx`
- `Frontend/src/features/preferencias/ficha2B.test.tsx`
- `Frontend/src/features/preferencias/storage.ts`
- `Frontend/src/i18n/LocaleContext.tsx`
- `Frontend/src/i18n/public.tsx`
- `Frontend/src/i18n/ux.ts`
- `Frontend/src/lib/money.test.tsx`
- `Frontend/src/lib/money.ts`

Cambios adicionales de esta continuación:

- `Frontend/src/features/preferencias/ficha2A.test.tsx`: adaptación de dos pruebas al selector de rango y control de huéspedes vigentes; no se modificó el calendario de producción.
- `Frontend/src/pages/PersonalPage.tsx`: corrección puntual de desbordamiento móvil por nombres/correos largos.
- `Frontend/scripts/verify-admin-responsive.cjs`: regresión de Chromium de solo lectura, credenciales externas, sin mocks.
- `qa/registry.yml`: hallazgo confirmado `QA-ADMIN-UX-001`, sin reemplazar otros hallazgos.
- Este informe: resultados y límites reales de la verificación.

### Recorridos reales comprobados

| Área | Comprobación realizada |
| --- | --- |
| Acceso | Registro de cliente auxiliar y login administrativo/cliente reales desde Chromium; `/auth/me` responde correctamente. |
| Permisos | Cliente rechazado con `403` en Usuarios y Empleados; Facturas/Pagos del cliente devuelven sus listas vacías. Lectura anónima de Usuarios devuelve `401`. |
| Habitaciones | Catálogo y búsqueda real de disponibilidad con rango 20–23/11/2030; tres noches y precios GTQ/USD coherentes. No se creó reserva. |
| Moneda | GTQ inicial, USD, navegación, recarga, cambio de idioma y vuelta a GTQ. Ejemplos: Q1,250 → US$160.26; Q2,800 → US$358.97. |
| Catálogos | Habitaciones, Actividades, Bienestar, Eventos, Restaurante/carta y Amenidades consultan la API real. Carta Q95 → US$12.18. |
| Carrito/checkout | Estado real sin carrito activo y navegación autenticada correctos. Totales y separación de Stripe comprobados adicionalmente por pruebas unitarias con HTTP/Stripe simulados; no se simuló un pago en el navegador real. |
| Facturación | Dos registros reales, listado y apertura del detalle. Documento conservado en GTQ aunque la preferencia pública sea USD. Solo consulta. |
| Pagos | Consulta real, filtros/listado vacío; no existen pagos para verificar un detalle con datos. Ningún cargo, aprobación o reembolso ejecutado. |
| Usuarios | Alta y edición de cuenta auxiliar ID 21 mediante formulario real; cambio de rol a recepcionista y regreso a empleado operativo, con confirmación y persistencia SQL; cuenta dejada inactiva. |
| Personal | Alta de empleado auxiliar ID 2 asociado a usuario propio y sede real, edición de área, comprobación SQL y eliminación de ese mismo registro auxiliar. Empleados originales conservados. |
| Otras pantallas administrativas | Sedes, Inicio, Tipos de habitación, Reservas, Restaurante/reservas, Amenidades/reservas, Actividades/instructores/reservas, Bienestar/terapeutas/citas, Eventos/servicios/reservas y Parqueos: apertura y GET reales `200`, sin alertas de error. Solo lectura. |
| Idiomas y móvil | Personal/Usuarios en ES y EN; 16 comprobaciones de ancho y buscador en 320, 390, 768 y 1440 px tras la corrección. Catálogo público de habitaciones comprobado también a 390×844. |

No se interceptaron respuestas ni se sustituyó la API por mocks en los recorridos de Chromium.
Los listados vacíos se verificaron como tales; no prueban operaciones con registros inexistentes.
No se certifica CRUD completo de todos los módulos por haber abierto sus páginas.

### Defectos y regresiones

Los dos fallos conocidos de `ficha2A.test.tsx` buscaban controles de calendario antiguos:

1. `buscador y barra comparten sede sin perder fechas ni huéspedes`.
2. `revalida mensajes visibles al cambiar idioma conservando los campos`.

Se adaptaron a `setStayDates`, `expectStayDates` y `changeGuestCount`, verificando que
rango y huéspedes persisten y que las validaciones cambian de idioma. No se reintrodujeron
campos de fecha duplicados ni se debilitó la expectativa funcional.

Se reprodujo `QA-ADMIN-UX-001`: Usuarios ensanchaba el documento a 557 px en viewport de 390 px;
la prueba real falló también a 320 px (558 px de documento). La causa fue el ancho mínimo
intrínseco de tarjetas/textos con correos largos. La corrección se limita a `min-w-0`,
`overflow-wrap:anywhere` y etiquetas de estado que conservan su ancho. La misma regresión
aprobó después en ambos idiomas y cuatro tamaños, sin errores de página ni escrituras inesperadas.

### Resultados de validación

- Regresión frontend general previa a los cambios ajenos posteriores de Habitaciones: **769 pruebas aprobadas, 102 archivos, cero fallos**. Se excluyó únicamente `src/test/integration/**` del comando unitario; no se alteraron ni deshabilitaron esos archivos. La comprobación real se realizó separadamente con Chromium y HTTP.
- Foco inicial moneda/calendario: **58 pruebas aprobadas**.
- Regresión después de la corrección móvil: **74 pruebas aprobadas, 9 archivos** (admin-core, layout, calendario y moneda).
- Verificación adicional tras la actualización ajena de Habitaciones: **34 pruebas aprobadas, 3 archivos** (catálogo, creación y consumidores de preferencias).
- Chromium real responsive: **16 comprobaciones aprobadas**, cero errores JavaScript y cero mutaciones distintas del login.
- Typecheck frontend y build: **APROBADO** (TypeScript sin errores y Vite compilado; la incompatibilidad intermedia desapareció tras la actualización ajena).
- Typecheck backend: **APROBADO**, `npm --prefix backend run typecheck`.
- Advertencia de bundle mayor a 500 kB conservada; no se cambió el umbral.
- Los hashes SQL de tarifas de tipos de habitación, actividades, bienestar, salones y carta coincidieron antes/después. El selector no cambió precios persistidos.
- Los registros originales de empleados y usuarios coincidieron por hash antes/después de retirar los auxiliares.

Durante la verificación final aparecieron modificaciones ajenas recientes de Habitaciones
(sede/nombre comercial del tipo, catálogo y disponibilidad). No se editaron ni revirtieron
esos archivos. Un intento de build intermedio detectó desajuste de tipos en `CrearReservaPage`;
se volvió a comprobar después de la actualización concurrente, sin atribuir ese defecto a José
ni a la integración monetaria.

### Limpieza y retiro seguro del acceso temporal

- Cliente auxiliar ID **15** y usuario operativo auxiliar ID **21**: **inactivos**.
- Empleado auxiliar ID **2**: eliminado por el endpoint normal, después de comprobar sus cambios.
- Administrador temporal ID **19**: activo para la revisión del propietario. Ninguna cuenta previa fue restablecida, desactivada o eliminada.
- Para retirarlo, entrar con **otro administrador existente**, abrir **Personal y usuarios → Usuarios**, localizar **ID 19**, elegir **Desactivar** y confirmar. La cuenta no puede desactivarse a sí misma.
- El middleware consulta `activo` en PostgreSQL en cada petición; la desactivación también bloquea los JWT ya emitidos. Confirmar el estado inactivo y luego eliminar el archivo protegido de credenciales y los archivos locales de sesión/verificación. Conservar el registro inactivo para trazabilidad.

### Pendientes y estado final

- No se verificaron cargos, reembolsos, emisión fiscal ni checkout con cobro. Stripe y reglas financieras permanecen intactos.
- CRUD de otros módulos y conflictos de reservas requieren verificaciones específicas posteriores; en esta sesión sus páginas y lecturas sí se comprobaron.
- Ampliaciones administrativas diferidas descritas en secciones anteriores siguen pendientes; abrir sus módulos no las convierte en implementadas.
- Git conserva la rama y HEAD originales, sin commits/push ni eliminación de cambios ajenos. Los archivos ajenos modificados durante el recorrido se conservaron íntegros, sin intervención de esta tarea.
- Graphify frontend actualizado con `graphify update .`: **2099 nodos, 10094 relaciones, 87 comunidades**. El procedimiento respaldó automáticamente cinco archivos curados antes de regenerar las salidas. No se reemplazó manualmente contenido del grafo ni se modificó `docs/informe-avances.md`.
- Evidencia y logs de esta sesión fuera del repositorio en `/tmp/hunahpu-real-browser` y `/tmp/hunahpu-real-*.log`; el directorio de navegador tiene permisos `0700`. Los logs no incluyen credenciales.
