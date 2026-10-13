# Fase 5G — Estructura final del repositorio

## Alcance

Esta fase audita la estructura de la raíz, backend, material visual del
frontend, documentación, artefactos generados, Docker y archivos académicos.
La decisión conservadora es no mover, borrar, renombrar ni versionar elementos
protegidos en esta fase.

## Baseline

- Rama: `refactor/backend-architecture`
- HEAD: `6d566ff941b0abaa5bd4a742b576f81eab4b1fbf`
- Tests conocidos: 65/65; unitarias 37/37; integración 28/28.
- TypeScript: correcto.
- OpenAPI protegido por pruebas: 93 paths / 184 operaciones.
- Fase 5F: `GO_FASE_5G`.
- El baseline histórico menciona 41 migraciones `up`; la inspección actual
  encuentra 43 archivos de migración. Debe reconciliarse en Fase 5H.

## Hallazgos principales

- La raíz contiene backend, material visual del futuro frontend, documentación
  técnica/académica e infraestructura transversal.
- `backend/` es una aplicación Node/TypeScript estable y no requiere otra
  reorganización interna.
- `Frontend/` contiene mockups, imágenes y guía de diseño; no es una aplicación
  React funcional y queda intacto para Fase 6.
- `planificacion/refactorizacion/` es historial de auditoría útil; moverlo
  masivamente produciría ruido Git sin beneficio demostrado.
- `backend/openapi.json` y `backend/scripts/` son artefactos locales protegidos:
  se recomienda conservarlos sin cambiar su estado Git hasta revisión humana.

## Cambios realmente aplicados

Sólo se creó esta documentación. No se movió, borró, renombró, versionó ni
ignoró ningún archivo estructural.

## Estructura objetivo propuesta

Mantener como base ligera:

```text
/
├── backend/
├── Frontend/                 # material visual actual; aplicación futura
├── planificacion/
├── docker-compose.yml
├── .gitignore
└── documentación transversal de raíz
```

Una futura `docs/` puede organizar documentación técnica/académica nueva, pero
no se recomienda migrar las 392 piezas históricas de `planificacion/` sólo por
estética.

## Preparación

- Para Fase 5H: ejecutar la regresión final y reconciliar migraciones,
  documentación, dependencias y estructura.
- Para Fase 6: conservar `Frontend/` y crear el scaffold React sólo con
  aprobación, sin sobrescribir sus prototipos.

## Gate

**GO_FASE_5H**

La auditoría estructural terminó sin cambios de runtime ni alteración de
protegidos. Este gate no inicia Fase 5H ni Fase 6.
