# Trabajo paralelo de Diego

| Actividad | Estado recomendado | Motivo |
|---|---|---|
| Documentación, matrices y revisión de commits | Puede hacerse en paralelo | no colisiona con reglas |
| Pruebas de contratos y OpenAPI | Puede hacerse en paralelo con aviso | evitar cambiar los mismos tests que José |
| Calidad arquitectónica y análisis de imports | Puede hacerse en paralelo | no cambia negocio |
| Infraestructura de PostgreSQL test | Puede hacerse en paralelo, sin mover setup | José depende de ella |
| Preparación frontend/S3 | Parcialmente en paralelo | no alterar contratos de lotes |
| Cambios en reservas/pagos/facturación | Conviene esperar | posible solapamiento semántico |
| `app.ts`, env, Sequelize, modelos/migraciones | Bloqueado hasta coordinación | impacto transversal |
| Retiro de fachadas piloto | Bloqueado | requiere evidencia de consumidores |
