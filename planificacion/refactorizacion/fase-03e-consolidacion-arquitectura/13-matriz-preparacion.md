# Matriz de preparación

| Bloque | Estado | Evidencia | Bloquea frontend |
|---|---|---|---|
| Arquitectura | Verificado | Dos módulos y pruebas arquitectónicas | No para consumo de endpoints existentes |
| Pruebas | Verificado | 63 pruebas; unitarias e integración | No, pero limita confianza en endpoints sin cobertura |
| Seguridad | Parcial | Env, CORS, Helmet, rate limit, JWT y roles | Sí para despliegue público; no para mocks locales |
| Observabilidad | Verificado | Logger, request ID y access logs | No |
| Persistencia | Verificado | Sequelize y 41 migraciones existentes | No para endpoints actuales |
| Transacciones | Parcial | Concurrencia cubierta en reservas existentes | Sí para nuevos flujos críticos |
| Reglas de negocio | Parcial | Pilotos conservados; cambios de José aún no integrados | Sí para funcionalidades dependientes de José |
| Integración con José | Pendiente | Referencia local no actualizada con fetch | Sí para declarar contratos finales |
| Contratos API | Parcial | OpenAPI y pruebas de pilotos | Sí para endpoints sin esquemas completos |
| Frontend | Parcial | JWT, errores y rutas disponibles | No para prototipos; sí para producción completa |
| Despliegue | Pendiente | Configuración validada, operación no certificada | Sí para producción |

El bloqueador real para integrar es la referencia Git posiblemente desactualizada y la ausencia de revisión semántica de cambios críticos. El frontend puede desarrollar componentes contra contratos ya verificados mientras se completan esas decisiones.
