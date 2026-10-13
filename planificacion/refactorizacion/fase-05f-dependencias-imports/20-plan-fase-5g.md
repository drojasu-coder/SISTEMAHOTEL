# 20 — Plan para Fase 5G

## FASE 5G = ESTRUCTURA FINAL DEL REPOSITORIO

Fase 5G no es una fase adicional de upgrades npm. Su objetivo será preparar,
sin ejecutar todavía movimientos, la estructura final del repositorio:

- estructura final de la raíz y de `backend/`;
- futura ubicación del frontend;
- `docs/` y documentación técnica;
- documentación académica e historial de refactorización;
- `backend/openapi.json` y `backend/scripts/`;
- ZIPs, `script.sql`, DERCAS y `TABLAS-Y-RELACIONES.md`;
- README principal;
- Docker e infraestructura;
- naming y ubicación de artefactos;
- clasificación de qué mover, conservar, archivar o ignorar;
- preparación para Fase 5H.

## Deuda técnica fuera del alcance de Fase 5G

Los upgrades o reemplazos pendientes permanecen como deuda técnica y
mantenimiento futuro, no como trabajo automático de Fase 5G:

- `ts-node-dev`/`chokidar`/`braces`;
- `Sequelize`/`uuid`;
- Stripe major;
- dotenv major;
- demás resultados de `npm outdated`.

No se ejecutan todavía movimientos estructurales ni se inicia Fase 5G con este
documento; sólo queda preparada su revisión.
