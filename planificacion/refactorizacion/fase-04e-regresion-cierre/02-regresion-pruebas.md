# Regresión y resultados

| Comando | Resultado |
|---|---|
| `npm test` | 65/65 exitosas |
| `npm run test:unit` | 37/37 exitosas en 9 archivos |
| `npm run test:integration` | 28/28 exitosas en 5 archivos |
| `npm run test:coverage` | 65/65; 42.51% statements, 17.22% branches, 25.20% functions, 42.83% lines |
| `npm run typecheck` | correcto |

La ejecución produjo `backend/coverage/` como artefacto local no versionado;
no se incorporó a Git. Vite mostró el warning conocido sobre sintaxis ESM en
un paquete CommonJS, sin fallo de pruebas.

La regresión cubre seguridad, arquitectura, OpenAPI, autenticación,
reservas, pagos, Stripe, sucursales y configuración mediante la suite
existente. La cobertura global no equivale a pruebas HTTP específicas para
las 184 operaciones.
