# Métricas y health checks

Se auditó `/api/health`; continúa siendo público y devuelve exactamente su contrato existente. Los access logs ya permiten derivar conteos, status y latencias en un recolector externo.

No se expone diagnóstico de PostgreSQL ni se agregan endpoints internos. Prometheus/OpenTelemetry y checks de dependencias son propuestas para Fase 3.

