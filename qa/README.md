\# SISTEMAHOTEL QA



This directory contains the persistent quality-engineering record for

SISTEMAHOTEL.



\## Core methodology



RED -> FIX -> GREEN -> REGRESSION



A production defect must be demonstrated before it is fixed.



\## Finding states



\- candidate

\- confirmed

\- fixing

\- corrected

\- regression\_failed

\- rejected



\## Severities



\- critical

\- high

\- medium

\- low



\## Main categories



\- FUNC: functional / business rules

\- CONC: concurrency / race conditions

\- FIN: financial integrity

\- SEC: security

\- AUTH: authentication / authorization

\- DATA: database integrity

\- VAL: validation

\- PERF: performance

\- TX: transaction integrity



\## Identifier format



QA-<MODULE>-<CATEGORY>-<NUMBER>



Examples:



QA-CART-FUNC-001

QA-CART-FIN-001

QA-PAY-CONC-001

QA-AUTH-SEC-001



\## Evidence standard



A confirmed finding should contain:



\- invariant

\- reproduction test

\- expected result

\- actual result

\- affected endpoint/service

\- severity

\- root cause

\- correction

\- regression test

\- final verification



\## Database safety



Integration QA is permitted only against:



hotel\_test\_db



The QA DB guard must confirm the test database before destructive or

integration tests continue.



\## Important



A green test suite is not sufficient by itself.



Concurrency tests must also verify final PostgreSQL state.



Financial tests must verify persisted amounts and state transitions.



Security tests must verify authorization and ownership, not only route

availability.


---

## Entorno de pruebas tras la integración con la refactorización

- La base aislada se levanta con `docker compose -f backend/docker-compose.test.yml up -d`
  (PostgreSQL en `127.0.0.1:55432`, base `hotel_test_db`).
- La conexión sale de `TEST_DATABASE_URL` (`backend/src/config/sequelize.config.js`),
  que solo acepta `localhost:55432/hotel_test_db` en `NODE_ENV=test`.
- Aplicar migraciones pendientes antes de la suite QA:
  `cd backend && NODE_ENV=test TEST_DATABASE_URL=<url> npx sequelize-cli db:migrate`.
- `backend/vitest.config.ts` define dos proyectos que comparten la base y corren en serie:
  `baseline` (`tests/unit`, `tests/integration`) y `qa` (resto de `tests/**`, con guard
  global, truncado por prueba y `AUTH_RATE_LIMIT_MAX` elevado solo en `tests/setup/env.ts`).
- Ejecutar un proyecto: `npm --prefix backend test -- --project qa`.
