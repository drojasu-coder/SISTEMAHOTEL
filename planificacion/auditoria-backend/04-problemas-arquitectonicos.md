# 04 — Problemas arquitectónicos priorizados

| ID | Hallazgo | Evidencia | Severidad / impacto | Tratamiento seguro |
|---|---|---|---|---|
| A-01 | Respuestas incompatibles entre módulos | Controladores con `status/data` y otros con `success/statusCode/message/data` | Crítica; frontend debe bifurcar consumo | Caracterizar respuestas y agregar serializador compatible; no reemplazar globalmente en fase 1. |
| A-02 | Falta de pruebas | No hay `test` script ni archivos de pruebas | Crítica; alto riesgo al tocar hardening/pagos | Crear primero pruebas de contrato y reglas sobre PostgreSQL de prueba. |
| A-03 | Servicios sobredimensionados | `pago.service.ts` ~29 KB; reservas habitación/amenidad/actividad/parqueo muy grandes | Alta; cambios difíciles de revisar | Extraer casos de uso puros y políticas después de cubrir comportamiento. |
| A-04 | Duplicación de disponibilidad/estados | Cada reserva implementa fechas, traslapes y transiciones localmente | Alta; correcciones divergentes | Extraer utilidades/policies tipadas por dominio, manteniendo códigos actuales. |
| A-05 | Acceso directo a modelos desde servicios | ~40 servicios repiten `require("../../models")` | Alta; acoplamiento y difícil mocking | Introducir repositorios/adapters por módulo de forma incremental. |
| A-06 | Modelos JS dinámicos y aplicación TS | `src/models/*.js`, controllers/services `.ts` | Alta; contratos de tipos incompletos | Tipar interfaces de persistencia primero; migrar un modelo por vez, sin tocar tablas. |
| A-07 | Configuración sensible en código | `config.json` tiene credenciales para development/test/production | Alta; riesgo operativo | Leer DSN/credenciales de env y fallar explícitamente si faltan; mantener defaults solo en local documentado. |
| A-08 | Middleware inconsistente | Auth/roles/validadores se aplican por ruta o `router.use` | Alta; riesgo de endpoint accidentalmente público | Generar matriz de middleware y probar 401/403 por endpoint antes de reorganizar routers. |
| A-09 | Webhook acoplado al orden global | `express.raw` se registra antes de `express.json` | Alta; rompería Stripe si se mueve | Encapsular webhook en router/adapter con prueba de firma raw. |
| A-10 | Rutas grandes mezclan documentación y composición | Varias rutas superan 8 KB y algunas 10–11 KB | Media; mantenimiento y divergencia OpenAPI | Separar schemas/OpenAPI de wiring sin cambiar URL. |
| A-11 | Consultas sin política transversal | `findAll` sin estándar visible de paginación/atributos; includes por servicio | Media; rendimiento y respuestas variables | Medir primero; añadir paginación explícita solo donde el contrato lo permita. |
| A-12 | Transacciones y tipos débiles en pagos | Uso de `transaction: any` y múltiples caminos Stripe/local | Alta en dinero; riesgo de consistencia | Pruebas concurrentes, adapter Stripe y tipos de estado antes de extraer. |
| A-13 | CORS/configuración operativa global | `cors()` abierto; límites/logging no parametrizados | Media/alta en despliegue | Definir allowlist por ambiente y configuración validada, con prueba de preflight. |
| A-14 | Seeders de fixtures mezclan ambientes | Fixtures de pago/Stripe junto a demo | Media; contaminación de datos | Separar clasificación y documentar comandos; no ejecutar sobre datos existentes. |
| A-15 | Nomenclatura irregular | `empleado.route.ts`, `facturaItem`, nombres JS/TS y servicios duplicados (`pago.service`/`pagos/pago.service`) | Media; onboarding y imports ambiguos | Normalizar solo con renombres semánticos y revisión de referencias. |

## Dependencias circulares

No se encontró una dependencia textual directa de rutas/controladores hacia servicios en sentido inverso, ni de servicios hacia rutas/controladores. Sí hay dependencias compartidas que pueden formar ciclos en tiempo de ejecución si se extraen sin cuidado: `models/index.js` carga asociaciones dinámicamente; middleware de auth usa modelos; pagos usa carrito, reservas, Stripe y reembolsos. Debe confirmarse con un grafo de imports antes de introducir barrels.

## Consultas y estados a revisar

- Traslapes deben definir claramente si los límites son inclusivos/exclusivos y si estados cancelados liberan disponibilidad.
- Acciones de estado deben definir una máquina de transiciones única; no confiar solo en strings de cada servicio.
- Pago, reembolso, carrito expirado y reserva deben probarse como una misma saga de negocio, no como CRUD aislado.

## Priorización

1. A-01, A-02, A-07, A-09 y A-12: afectan contrato, dinero, seguridad o posibilidad de verificar.
2. A-03, A-04, A-05, A-06 y A-08: afectan la seguridad de la refactorización.
3. A-10, A-11, A-13, A-14 y A-15: mejoras posteriores con medición y compatibilidad.
