# Matriz de criterios de aceptación

| Criterio | Verificación | Resultado requerido |
|---|---|---|
| Compila | `npm run typecheck` | éxito |
| Suite baseline | `npm test` | todas las pruebas previas pasan |
| Nuevas pruebas | Vitest dirigido y suite | pasan y son deterministas |
| Contratos | comparar URL, método, status, JSON y errores | sin cambios no aprobados |
| Swagger | `openapi.test.ts` y diff de spec en memoria | sin pérdida accidental |
| Archivos | `git diff --name-only` | sólo lote autorizado |
| Seguridad | JWT, roles, raw webhook, errores | sin relajación |
| Migraciones/modelos | revisión explícita | sin cambios o autorización |
| Secretos | búsqueda de env reales/keys | ninguno |
| Dominios | revisión de imports/diffs | sin cambios cruzados no declarados |
| Transacciones | pruebas y revisión de locks | invariantes preservadas |

En pagos y reservas añadir concurrencia, estados inválidos, ownership, rollback y errores de persistencia antes de aceptación.
