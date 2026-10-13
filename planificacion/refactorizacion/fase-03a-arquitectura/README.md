# Fase 3A — Auditoría arquitectónica y diseño de modularización

## Alcance

Esta fase es exclusivamente de análisis y diseño. No se reorganizaron carpetas, no se movieron módulos y no se modificaron contratos HTTP, modelos, migraciones, dependencias ni lógica de negocio.

## Evidencia base

- Rama: `refactor/backend-architecture`.
- Commit verificado: `4896e3a` (`feat: add structured logging and request correlation`).
- Línea base: 55 pruebas exitosas y TypeScript correcto.
- Estado local ajeno al alcance: `script.sql` modificado y varios archivos protegidos/no rastreados preexistentes.

## Entregables

1. [Inventario del backend](./01-inventario-backend.md)
2. [Arquitectura actual](./02-arquitectura-actual.md)
3. [Problemas arquitectónicos](./03-problemas-arquitectonicos.md)
4. [Mapa de dependencias](./04-mapa-de-dependencias.md)
5. [Dominios y límites](./05-dominios-y-limites.md)
6. [Arquitectura objetivo](./06-arquitectura-objetivo.md)
7. [Convenciones modulares](./07-convenciones-modulares.md)
8. [Transacciones críticas](./08-transacciones-criticas.md)
9. [Matriz de riesgos](./09-matriz-riesgos.md)
10. [Módulo piloto](./10-seleccion-modulo-piloto.md)
11. [Plan 3B–3E](./11-plan-fase-3b-3e.md)
12. [Compatibilidad con José](./12-compatibilidad-jose.md)
13. [Preparación del frontend](./13-preparacion-frontend.md)
14. [Baseline de pruebas](./14-pruebas-baseline.md)
15. [Decisiones pendientes](./15-decisiones-pendientes.md)

## Decisión resumida

Se recomienda un monolito modular pragmático, manteniendo temporalmente las carpetas por capa y extrayendo un módulo pequeño mediante fachadas/adaptadores sólo cuando una migración tenga pruebas equivalentes. No se recomienda microservicios ni una reescritura Clean Architecture completa.

