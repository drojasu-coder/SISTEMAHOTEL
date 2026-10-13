# Preparación para frontend

| Necesidad | Estado | Evidencia / pendiente |
|---|---|---|
| URLs y métodos | Disponibles | inventario de 184 operaciones efectivas |
| JWT y roles | Disponibles y verificadas parcialmente | pruebas auth; cobertura por endpoint desigual |
| Validación de entrada | Disponible | Zod y middleware; falta matriz completa |
| Respuestas y errores | Disponibles | error middleware; falta contrato exhaustivo por dominio |
| Paginación/filtros | Incompletos | varían por router; documentar antes de pantallas |
| Fechas/zonas horarias | Pendientes | `APP_TIMEZONE` existe, pero falta contrato por endpoint |
| Imágenes/archivos/S3 | Pendientes | no implementar en 4A |
| Pagos | Parcial | Stripe/webhook probado en límites; estados requieren 4D |
| OpenAPI | Parcialmente verificado | 93 paths/184 operaciones; schemas no equivalen a pruebas |
| Ambientes | Disponibles para pruebas | desarrollo/producción requieren validación operacional |

El frontend puede iniciar prototipos contra endpoints y respuestas verificadas, pero los flujos de reservas, pagos, facturación y archivos deben esperar contratos estabilizados y pruebas de integración. No se implementó frontend ni S3.
