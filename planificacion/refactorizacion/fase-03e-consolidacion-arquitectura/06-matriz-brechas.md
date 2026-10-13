# Matriz de brechas

| Área | Arquitectura actual | Objetivo 3A | Completado | Pendiente / clasificación |
|---|---|---|---|---|
| Organización | Capas globales más dos módulos | Módulos por funcionalidad | Pilotos implementados | Migración gradual del resto; mejora estructural |
| Persistencia | Modelos Sequelize compartidos | Persistencia estable detrás de límites pragmáticos | Sin cambios riesgosos | Evaluar boundaries por dominio; deuda aceptable |
| OpenAPI | Routers legacy son fuente documental | Contrato generado desde composición clara | Regresión en memoria | Unificar ubicación sin romper Swagger; mejora estructural |
| Ciclos | Imports relativos analizados | Límites verificables | Cero ciclos detectados | Cubrir aliases/dinámicos; limitación de herramienta |
| Fachadas | Reexports para transición | Compatibilidad explícita | Probadas por identidad | Retiro sólo con evidencia; deuda aceptable |
| Seguridad | Env validado, CORS, Helmet, rate limit, JWT | Plataforma consistente | Verificado por suite | Revisión operacional de secretos; pendiente de despliegue |
| Observabilidad | Logger, request ID y access logs | Diagnóstico centralizado | Verificado | Métricas/alertas operacionales; mejora futura |
| Transacciones | Garantías existentes en dominios críticos | Tratamiento por caso de uso | No alterado | Revisión conjunta en Fase 4; riesgo funcional |
| Integración José | Referencia local disponible | Flujo de integración controlado | Inventariada | Actualizar referencia con autorización; bloqueador de integración |
| Frontend | Contratos existentes y OpenAPI | API estable consumible | Parcial | Paginación, fechas, archivos y DTOs; futura Fase 5 |

No hay un problema crítico que impida continuar con preparación. Sí existen riesgos funcionales que impiden integrar cambios de José sin actualizar referencias y ejecutar regresión por dominio.
