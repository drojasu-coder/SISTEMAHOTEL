# Eventos públicos · mejora funcional · 2026-10-27

Alcance: catálogo, detalle y formulario público. Rama comprobada `refactor/backend-architecture`. Se conservaron las diferencias previas de 4A. No se modificaron autenticación/retorno, habitaciones, pagos/checkout, medios globales, AWS, administración ni `docs/informe-avances.md`. No se hicieron cambios de rama, worktrees, commits o push.

## Defectos reproducidos y corregidos

| ID | Esperado | Resultado anterior y causa | Corrección |
| --- | --- | --- | --- |
| QA-EVT-UI-001 | ID inválido: error comprensible, regreso al catálogo y ninguna petición inválida | `useSalonQuery` estaba deshabilitado, pero `isPending` dejaba el detalle cargando para siempre | Validación de ID seguro antes de calcular el estado; aviso sin botón de reintento inútil |
| QA-EVT-UI-002 | Diferenciar red/servidor de inexistencia | Todo error recibía la descripción de salón inexistente | 404 separado de conexión/servidor; reintento de lectura y regreso con contexto |
| QA-EVT-UI-003 | Dos submit en un turno: una creación | Dos llamadas a `createReserva`; `isPending` aún no cambiaba durante la validación asíncrona | Bloqueo sincrónico previo a validar y mutación pública con `retry: false` |

Evidencia RED: `/tmp/hunahpu-eventos-red.log`, tres casos fallidos antes de corregir. Regresiones preservadas en `PublicEventsUX.test.tsx`. Son defectos de interfaz probados con mocks, no evidencia de duplicados persistidos ni de concurrencia PostgreSQL.

**Consolidación pendiente:** trasladar estos tres hallazgos a `qa/registry.yml` cuando se coordine su edición. Ese registro ya tenía cambios compartidos; se omite aquí su escritura por la instrucción de no interferir con otros agentes. Los hallazgos no se declaran cerrados formalmente en el registro central.

## Mejoras entregadas

- Catálogo anónimo con sede, capacidad, descripción, imagen/créditos y tarifa existentes. La búsqueda incluye sede. Compatibilidad con `Sucursal`, que es la asociación real del backend, además del DTO anterior `sucursal`. No se muestran IDs técnicos como nombres de sede.
- Detalle organizado, regreso con filtros/página, descripción ausente explícita y tratamiento neutro de medios existente. Sin características, servicios incluidos, plazos o políticas inventadas.
- Solicitud autenticada que crea `cotizacion`, con validación visible junto al campo de invitados, errores de negocio controlados y conservación de elecciones. Confirmación dentro del panel con referencia, sede, fecha, horario, invitados, estado e importe devueltos por el servidor; acceso explícito al detalle existente. Se elimina la combinación de redirección automática y cierre que podía descartar el resultado.
- Un resultado incierto bloquea otro envío, conserva una marca mínima por usuario/salón en sesión y permite consultar solicitudes autorizadas. La recuperación exige coincidencia de propietario y datos. Una lectura sin coincidencia no demuestra que la petición anterior terminara; preparar otro envío requiere revisión y confirmación expresas. Sin reintentos automáticos de creación ni garantía inventada de idempotencia entre dispositivos.
- ES/EN locales en `publicEventExperience.ts`, sin editar archivos de traducciones compartidos. Se reutilizan `PageContainer`, `PageHeader`, `CatalogFilters`, `CatalogState`, `ServiceCard`, `ServiceMedia`, `ServiceReservationPanel`, campos, `Alert`, `StatusBadge` y `MoneyReference`, sin modificar sus implementaciones.

## Contrato y límites comprobados

Lecturas de código: `backend/src/routes/eventos/{salon,reservaEvento}.routes.ts`, `services/eventos/{salon,reservaEvento}.service.ts`; cliente y hooks existentes de Eventos. Catálogo y detalle son públicos. POST exige autenticación y devuelve cotización; el servidor valida sede activa, capacidad, fecha y traslape, bloqueando los estados cotización/confirmada. No se modificaron estas reglas ni sus restricciones.

Lectura real local: `GET /api/salones` devolvió ocho salones en cuatro sedes, con ocho URLs de imagen, descripciones, capacidades y tarifas. Solo se realizaron lecturas reales. No se crearon reservas, cotizaciones, pagos ni datos de prueba.

No hay contrato inspeccionado de franjas libres ni de servicios incluidos/características estructuradas por salón. Necesidad: conocer alternativas verificadas o equipamiento incluido; faltan relaciones/DTO/consulta de disponibilidad adecuados. Impacto: se presentan datos descriptivos existentes y se deja la comprobación de conflicto al enviar. No se simulan horarios alternativos. No hay fuente aprobada de políticas publicables; no se inventan aprobación, cancelaciones o reembolsos. No se amplían endpoints en este trabajo.

Medios: se preservan únicamente las URLs y atribuciones entregadas por la API mediante `ServiceMedia`. No hay descargas, sustituciones arbitrarias ni cambios de S3/CloudFront. La auditoría de procedencia/autenticidad de las fotografías continúa en el alcance de Claude; esta entrega no certifica instalaciones a partir de una URL.

## Archivos de esta tarea

Modificados: `components/{CatalogoSalonesList,SalonDetalleCard,ReservaEventoModal}.tsx`.

Nuevos: `publicEventExperience.ts`, `PublicEventsUX.test.tsx` y este registro. Las diferencias anteriores de `CatalogoSalonesCliente.test.tsx` y `schemas/evento.schemas.ts` no pertenecen a esta tarea y no se alteraron.

## Verificación

- 26 pruebas correctas en `PublicEventsUX.test.tsx`, catálogo existente y regresión 4A. Sin omisiones nuevas ni cambios a pruebas antiguas. Incluyen exploración anónima, estados vacíos/error, regreso con contexto, capacidad, conflicto, referencia real, recuperación sin segundo POST, ES/EN y foco/Escape.
- Build frontend correcto, incluido `tsc --noEmit`; advertencia existente de bundle >500 kB. Logs: `/tmp/hunahpu-eventos-focused.log` y `/tmp/hunahpu-eventos-build.log`.
- Pruebas no destructivas con API simulada. No se ejecutó la suite de integración backend ni se usó `hotel_db:5432` para insertar datos.
- Navegador: la herramienta devolvió cero superficies conectadas. Accesibilidad comprobada en DOM/teclado; no se atribuye una inspección visual móvil/escritorio.
- No se ejecutó una auditoría general ni se corrigieron módulos ajenos. La verificación global puede incluir cambios paralelos; el inventario anterior delimita la autoría.

Verificación final explícita: `npm --prefix Frontend run typecheck` terminó con código 0 (`/tmp/hunahpu-eventos-typecheck-final.log`). Build y pruebas focalizadas terminaron con código 0. Revisión de diff de Eventos correcta.

Graphify frontend actualizado con `graphify update .`, mediante AST local y coste de API cero: 1.925 nodos, 9.267 aristas y 70 comunidades. JSON/HTML/reporte regenerados con bloqueo propio de la herramienta; el grafo representa el árbol compartido y no atribuye los cambios paralelos a esta tarea. Etiquetas conservadas o ajustadas por hub, sin etiquetado LLM. Diagnóstico: cero extremos ausentes/colgantes, cero aristas colapsadas y una autoarista recursiva existente; evidencia en `/tmp/hunahpu-eventos-graph-health.json`. No se actualizó el grafo de backend ni se intervinieron fuentes de otros módulos.
