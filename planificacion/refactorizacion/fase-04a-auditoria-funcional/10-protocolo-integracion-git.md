# Protocolo de integración Git

1. Acordar HEAD común y registrar fecha/hora.
2. Solicitar autorización para `git fetch origin`; no actualizar referencias automáticamente.
3. Comparar ancestro común, commits exclusivos y archivos solapados.
4. Asignar un responsable por dominio y congelar `app.ts`, configuración, modelos y migraciones durante cada lote.
5. Publicar commits pequeños con dominio, regla y pruebas descritos.
6. Revisar diff textual y semántico antes de integrar.
7. Ejecutar línea base en ambas referencias.
8. Integrar sólo un lote autorizado; nunca resolver conflictos de comportamiento sólo con Git.
9. Ejecutar unitarias, PostgreSQL, concurrencia, JWT, pagos, Stripe y OpenAPI después del lote.
10. Comparar URLs, métodos, JSON, status, códigos, roles y errores.
11. Registrar aceptación, incidencia o bloqueo.

Para evitar duplicación: José no modifica infraestructura transversal mientras Diego la mantiene; Diego no modifica services de reglas que José haya reclamado; cambios compartidos en `app.ts`, env, Sequelize, modelos y migraciones requieren revisión conjunta.

Este protocolo es una propuesta. No se ejecutó integración.
