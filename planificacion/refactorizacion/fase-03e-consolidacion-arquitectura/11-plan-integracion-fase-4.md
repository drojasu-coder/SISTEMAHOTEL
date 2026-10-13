# Plan seguro de integración para Fase 4

Este plan no se ejecuta en Fase 3E:

1. Solicitar autorización para actualizar referencias mediante `git fetch`.
2. Registrar HEAD, referencia de José y ancestro común actualizados.
3. Enumerar commits relevantes y clasificar archivos por dominio.
4. Separar cambios de infraestructura, seguridad, contratos y reglas de negocio.
5. Identificar migraciones, modelos y cambios de datos antes de tocar código.
6. Ejecutar la línea base completa en ambas referencias.
7. Integrar en lotes pequeños por dominio, empezando por cambios no críticos.
8. Resolver conflictos textuales conservando contratos y fachadas hasta verificar consumidores.
9. Revisar manualmente conflictos semánticos, especialmente reservas, pagos, Stripe y transacciones.
10. Ejecutar pruebas unitarias, integración PostgreSQL, concurrencia, JWT, OpenAPI y cobertura después de cada lote.
11. Comparar URLs, status, JSON, errores, autenticación y roles antes y después.
12. Aprobar sólo con revisión conjunta y evidencia reproducible.
13. Mantener commits pequeños para detener o revertir un lote específico sin perder modificaciones locales.

No se debe integrar directamente sobre archivos protegidos ni asumir que la ausencia de conflicto Git implica compatibilidad funcional.
