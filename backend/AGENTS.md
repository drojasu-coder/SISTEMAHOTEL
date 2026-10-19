\# SISTEMAHOTEL Backend QA Rules



These rules supplement the repository root AGENTS.md.



\## Working area



Backend:



backend/



Production source:



backend/src/



Tests:



backend/tests/



\---



\# Mandatory database guard



Integration tests must run against:



hotel\_test\_db



Expected startup output:



\[QA DB GUARD] Base de datos detectada: hotel\_test\_db

\[QA DB GUARD] ✅ Entorno de pruebas seguro



If this guard is not visible or another database is reported, stop.



\---



\# TypeScript verification



After modifying TypeScript:



npm --prefix backend exec tsc -- --noEmit



No TypeScript error may be ignored merely to continue QA.



\---



\# Testing hierarchy



Prefer this order:



1\. isolated named test

2\. complete test file

3\. related module

4\. complete backend regression



Do not immediately run the entire suite when debugging one hypothesis.



\---



\# Test author restrictions



When acting as qa-test-author:



Allowed:



backend/tests/\*\*



Do not modify:



backend/src/\*\*

backend/src/models/\*\*

backend/src/migrations/\*\*



A failing test is evidence, not permission to fix production code.



\---



\# Fixer restrictions



When acting as qa-fixer:



Do not weaken or delete a regression test.



Prefer the smallest production correction that restores the intended

invariant.



Inspect related service/controller/model/validation code before changing

anything.



\---



\# Sequelize / PostgreSQL



Critical check-then-write business rules must be evaluated for races.



When correctness depends on serialization, consider:



\- transactions

\- SELECT ... FOR UPDATE

\- database constraints

\- unique indexes

\- idempotency



Do not rely only on:



SELECT

then later

INSERT/UPDATE



without considering concurrency.



\---



\# Negative QA



Invalid client behavior should normally produce a controlled 4xx response.



Investigate unexpected:



500

Sequelize errors leaking to HTTP

invalid database casts

constraint errors exposed directly

stack traces in responses

